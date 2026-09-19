#!/usr/bin/env python3
"""Build a walkthrough session file from the existing audit reports.

Reads reports/summary.md + reports/unit_*.csv.json, writes
reports/walkthrough/session.json. Derives the four things the report schema
does not expose:
  1. events  - the per-column findings regrouped into whole events
  2. primary - the "led by tag_NN" driver, parsed out of summary.md prose
  3. clean   - the rationale for the files with findings: []
  4. order   - a teaching order, clean file first

Reports are never modified. Standard library only.
"""
import json, os, re, glob, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
REPORTS = os.path.join(ROOT, "reports")
OUT = os.path.join(REPORTS, "walkthrough")


def severity(layer, fault_type, n_cols):
    """The schema conflates severity with confidence, so derive it here."""
    ft = fault_type.lower()
    if layer == "system":
        return "high"
    if layer == "record":
        if n_cols > 5 or "missing rows" in ft or "scale change" in ft:
            return "high"
        return "medium"
    return "medium"


def parse_summary(path):
    """Pull per-file driver column and clean rationale out of the prose."""
    info = collections.defaultdict(dict)
    for line in open(path):
        m = re.match(r"\s*-\s+\*\*(unit_\d+\.csv)\*\*\s*\((\d+) rows\)\s*-\s*(.*)", line)
        if not m:
            continue
        fname, rows, rest = m.group(1), int(m.group(2)), m.group(3).strip()
        info[fname]["rows"] = rows
        info[fname]["summary_line"] = rest
        led = re.search(r"led by (tag_\d+)", rest)
        if led:
            info[fname]["primary"] = led.group(1)
        if rest.lower().startswith("clean"):
            info[fname]["verdict"] = "clean"
            info[fname]["clean_rationale"] = rest[len("clean."):].strip() or rest
        else:
            info[fname]["verdict"] = "faulted"
    return info


def main():
    summary = parse_summary(os.path.join(REPORTS, "summary.md"))
    files = sorted(glob.glob(os.path.join(REPORTS, "unit_*.csv.json")))
    units, n_findings = [], 0

    for path in files:
        fname = os.path.basename(path).replace(".json", "")   # unit_01.csv
        unit = fname.replace(".csv", "")
        rep = json.load(open(path))
        meta = summary.get(fname, {})
        n_findings += len(rep.get("findings", []))

        # regroup findings into events; co-moving columns share these four
        # fields by contract (AGENTS.md), so the grouping is deterministic
        groups = collections.OrderedDict()
        for f in rep.get("findings", []):
            key = (f["layer"], tuple(f["window"]), f["fault_type"], f["onset_estimate"])
            groups.setdefault(key, []).append(f)

        events = []
        for (layer, window, ftype, onset), members in groups.items():
            cols = [m["column"] for m in members]
            primary = meta.get("primary") if layer == "system" else None
            if primary not in cols:
                primary = cols[0]
            events.append({
                "layer": layer,
                "fault_type": ftype,
                "window": list(window),
                "onset_estimate": onset,
                "primary_column": primary,
                "coupled_columns": [c for c in cols if c != primary],
                "n_columns": len(cols),
                "confidence": round(sum(m["confidence"] for m in members) / len(members), 2),
                "severity": severity(layer, ftype, len(cols)),
                "evidence": {m["column"]: m["evidence"] for m in members},
            })

        # rule out record first, then measurement, then system (AGENTS.md order)
        rank = {"record": 0, "measurement": 1, "system": 2}
        events.sort(key=lambda e: (rank.get(e["layer"], 9), e["onset_estimate"]))
        for i, e in enumerate(events, 1):
            e["event_id"] = f"{unit}:e{i}"

        units.append({
            "unit": unit, "file": fname, "rows": meta.get("rows"),
            "verdict": meta.get("verdict", "faulted" if events else "clean"),
            "clean_rationale": meta.get("clean_rationale"),
            "summary_line": meta.get("summary_line"),
            "layers": sorted({e["layer"] for e in events}),
            "n_events": len(events), "events": events,
        })

    # teaching order: baseline first, then cheap and unambiguous, then coupled,
    # then whichever file stacks the most events
    def tier(u):
        if u["verdict"] == "clean":
            return 0
        if u["n_events"] >= 5:
            return 4
        if "system" in u["layers"]:
            return 3
        if "measurement" in u["layers"]:
            return 2
        return 1
    order = [u["unit"] for u in sorted(units, key=lambda u: (tier(u), u["unit"]))]

    session = {
        "generated_from": "reports/ (unmodified)",
        "n_units": len(units), "n_findings": n_findings,
        "n_events": sum(u["n_events"] for u in units),
        "teaching_order": order,
        "column_schema": json.load(open(files[0]))["schema"],  # identical in all files
        "units": {u["unit"]: u for u in units},
    }

    os.makedirs(OUT, exist_ok=True)
    dest = os.path.join(OUT, "session.json")
    with open(dest, "w") as fh:
        json.dump(session, fh, indent=1)
    print("wrote %s" % dest)
    print("  %d findings -> %d events over %d units"
          % (n_findings, session["n_events"], len(units)))
    print("  teaching order: %s" % " ".join(order))


if __name__ == "__main__":
    main()
