#!/usr/bin/env python3
"""Fast, low-accuracy audit reports. Demo use only.

One pass, fixed rules, no reasoning. Emits the same JSON shape as
generate-report, so the walkthrough skills can read the output unchanged.

    python3 .pi/skills/generate-report-2/fast_report.py --workspace DIR

--workspace is the folder the pi instance was given with /workspace. It is
required: pi keeps the workspace in memory and surfaces it only in the system
prompt, so this script cannot discover it. Do not guess it from the location
of this file - the skill may be installed outside the workspace - and do not
use the working directory, which pi requires to sit outside the workspace.

Data is read from the first of <workspace>/sensordata, <workspace>/data, or
<workspace> itself that holds *.csv. Reports are written to
<workspace>/reports. Override either with --in / --out; both must stay inside
the workspace, or pi's workspace guard will block the write anyway.

Every threshold below is arbitrary and deliberately untuned.
"""
import csv, json, math, os, sys, statistics

NBLOCK      = 10    # blocks per column
JUMP_SIGMA  = 4.0   # block-median jump, in robust sigma, to flag at all
SYSTEM_MIN  = 3     # columns jumping in the same block => call it system
FROZEN_RUN  = 8     # identical consecutive values => frozen
OUTLIER_SIG = 12.0  # robust sigma from the median => impossible value
MAX_FIND    = 6     # cap findings per file

def inside(root, target):
    """True when target is root or below it, after resolving symlinks."""
    root = os.path.realpath(root)
    target = os.path.realpath(target)
    return target == root or target.startswith(root + os.sep)


def mad_sigma(vals):
    if len(vals) < 3:
        return 0.0
    m = statistics.median(vals)
    return statistics.median([abs(v - m) for v in vals]) * 1.4826


def guess_type(vals):
    """Arbitrary range buckets. Wrong labels are acceptable here."""
    if not vals:
        return "indeterminate"
    m = abs(statistics.median(vals))
    if m > 1000:  return "flow"
    if m > 100:   return "temperature"
    if m > 10:    return "level"
    if m > 1:     return "pressure"
    return "composition"


def load(path):
    with open(path, newline="") as fh:
        rdr = csv.reader(fh)
        header = next(rdr)
        rows = list(rdr)
    cols = {h: [] for h in header}
    for row in rows:
        for h, raw in zip(header, row):
            cols[h].append(raw.strip())
    return header, cols, len(rows)


def numeric(raw_list):
    """(parsed values or None, indices that were missing/unparseable)"""
    out, missing = [], []
    for i, raw in enumerate(raw_list):
        if raw == "" or raw.lower() in ("nan", "na", "null", "none"):
            out.append(None); missing.append(i); continue
        try:
            f = float(raw)
            if math.isnan(f) or math.isinf(f):
                out.append(None); missing.append(i)
            else:
                out.append(f)
        except ValueError:
            out.append(None); missing.append(i)
    return out, missing


def analyse(path):
    header, cols, n = load(path)
    schema, findings, jumps = [], [], {}

    for name in header:
        if name in ("sample", "timestamp"):
            schema.append({"column": name, "type": "counter", "role": "index",
                           "confidence": 0.3, "evidence": "name matches an index column"})
            continue

        vals, missing = numeric(cols[name])
        clean = [v for v in vals if v is not None]
        schema.append({"column": name, "type": guess_type(clean), "role": "observed",
                       "confidence": 0.3, "evidence": "range-based guess"})
        if len(clean) < NBLOCK * 2:
            continue
        sigma = mad_sigma(clean) or 1e-9

        # --- record: missing cells
        if missing:
            findings.append({
                "column": name, "window": [missing[0], missing[-1] + 1], "layer": "record",
                "fault_type": "missing_values", "onset_estimate": missing[0], "confidence": 0.3,
                "evidence": f"{len(missing)} missing/unparseable cells, first at row {missing[0]}"})

        # --- record: frozen run
        run, start, best = 1, 0, (0, 0)
        for i in range(1, n):
            if vals[i] is not None and vals[i] == vals[i - 1]:
                run += 1
            else:
                if run > best[1]:
                    best = (start, run)
                run, start = 1, i
        if run > best[1]:
            best = (start, run)
        if best[1] >= FROZEN_RUN:
            findings.append({
                "column": name, "window": [best[0], best[0] + best[1]], "layer": "record",
                "fault_type": "frozen_channel", "onset_estimate": best[0], "confidence": 0.3,
                "evidence": f"{best[1]} identical consecutive values from row {best[0]}"})

        # --- record: impossible value
        med = statistics.median(clean)
        far = [i for i, v in enumerate(vals)
               if v is not None and abs(v - med) > OUTLIER_SIG * sigma]
        if far:
            findings.append({
                "column": name, "window": [far[0], far[-1] + 1], "layer": "record",
                "fault_type": "impossible_value", "onset_estimate": far[0], "confidence": 0.3,
                "evidence": f"{len(far)} values more than {OUTLIER_SIG:g} robust sigma from the median"})

        # --- biggest block-median jump, for the measurement/system call below
        edges = [round(b * n / NBLOCK) for b in range(NBLOCK + 1)]
        meds = []
        for b in range(NBLOCK):
            seg = [v for v in vals[edges[b]:edges[b + 1]] if v is not None]
            meds.append(statistics.median(seg) if seg else None)
        top = (0.0, None)
        for b in range(NBLOCK - 1):
            if meds[b] is None or meds[b + 1] is None:
                continue
            d = abs(meds[b + 1] - meds[b]) / sigma
            if d > top[0]:
                top = (d, b + 1)
        if top[0] >= JUMP_SIGMA:
            jumps[name] = (top[1], top[0], edges)

    # --- measurement vs system: how many columns jump in the same block
    per_block = {}
    for name, (blk, _, _) in jumps.items():
        per_block.setdefault(blk, []).append(name)
    for name, (blk, size, edges) in jumps.items():
        group = per_block[blk]
        system = len(group) >= SYSTEM_MIN
        findings.append({
            "column": name, "window": [edges[blk], edges[blk + 1]],
            "layer": "system" if system else "measurement",
            "fault_type": "step_change" if system else "bias_step",
            "onset_estimate": edges[blk], "confidence": 0.3,
            "evidence": (f"block-median jump of {size:.1f} robust sigma at block {blk}; "
                         + (f"{len(group)} columns jump in the same block"
                            if system else "no other column jumps in that block"))})

    findings.sort(key=lambda f: (f["onset_estimate"], f["column"]))
    return {"schema": schema, "findings": findings[:MAX_FIND]}


def main():
    args = sys.argv[1:]
    workspace = in_dir = out_dir = None
    force = False
    i = 0
    while i < len(args):
        if args[i] == "--workspace":
            workspace = args[i + 1]; i += 2
        elif args[i] == "--in":
            in_dir = args[i + 1]; i += 2
        elif args[i] == "--out":
            out_dir = args[i + 1]; i += 2
        elif args[i] == "--force":
            force = True; i += 1
        else:
            print(f"unknown argument: {args[i]}", file=sys.stderr)
            return 2

    if workspace is None:
        print("--workspace is required: pass the folder this pi instance was given "
              "with /workspace (it is named in your system prompt). This script cannot "
              "discover it - pi holds the workspace in memory only.", file=sys.stderr)
        return 2
    workspace = os.path.abspath(os.path.expanduser(workspace))
    if not os.path.isdir(workspace):
        print(f"workspace is not a directory: {workspace}", file=sys.stderr)
        return 1

    # Data lives in the workspace, not next to this file.
    if in_dir is None:
        for cand in ("sensordata", "data", "."):
            p = os.path.join(workspace, cand)
            if os.path.isdir(p) and any(f.endswith(".csv") for f in os.listdir(p)):
                in_dir = os.path.normpath(p)
                break
    if in_dir is None:
        print(f"no .csv files found in {workspace} (looked in sensordata/, data/, and the "
              "workspace root); pass --in DIR", file=sys.stderr)
        return 1
    out_dir = os.path.join(workspace, "reports") if out_dir is None else out_dir
    in_dir = os.path.abspath(os.path.expanduser(in_dir))
    out_dir = os.path.abspath(os.path.expanduser(out_dir))

    if not inside(workspace, out_dir):
        print(f"refusing to write outside the workspace: {out_dir} is not inside "
              f"{workspace}. pi's workspace guard would block it anyway.", file=sys.stderr)
        return 1

    if os.path.basename(out_dir.rstrip(os.sep)).startswith("hyv") and not force:
        print(f"refusing to write demo-quality output into {out_dir} - that folder holds "
              "the hand-checked reports. Pick another --out, or pass --force.", file=sys.stderr)
        return 1

    files = sorted(f for f in os.listdir(in_dir) if f.endswith(".csv"))
    if not files:
        print(f"no .csv files in {in_dir}", file=sys.stderr)
        return 1
    os.makedirs(out_dir, exist_ok=True)

    lines = ["# Fast pass - demo quality, low accuracy",
             "",
             f"Generated by generate-report-2 from `{os.path.relpath(in_dir, workspace)}/` "
             "by fixed rules, with no per-file reasoning. Labels are unreliable and "
             "every confidence is 0.3. Not for decisions.",
             ""]
    for fname in files:
        rep = analyse(os.path.join(in_dir, fname))
        with open(os.path.join(out_dir, fname + ".json"), "w") as fh:
            json.dump(rep, fh, indent=2)
        f = rep["findings"]
        if not f:
            verdict = "no findings above threshold"
        else:
            layers = {}
            for x in f:
                layers[x["layer"]] = layers.get(x["layer"], 0) + 1
            verdict = ", ".join(f"{v} {k}" for k, v in sorted(layers.items()))
            verdict += f"; first at row {f[0]['onset_estimate']} ({f[0]['column']})"
        lines.append(f"- **{fname}** - {verdict}")
        print(f"wrote {os.path.relpath(out_dir, workspace)}/{fname}.json ({len(f)} findings)")

    with open(os.path.join(out_dir, "summary.md"), "w") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"wrote {os.path.relpath(out_dir, workspace)}/summary.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
