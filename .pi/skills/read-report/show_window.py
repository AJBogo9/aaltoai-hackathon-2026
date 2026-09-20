#!/usr/bin/env python3
"""Show the raw data behind an event, so the human sees it instead of reading about it.

  python3 show_window.py unit_04 tag_36 tag_49 --window 180 891

The CSVs are found in sensordata/ or data/ under the current directory, or
named with --data DIR.

First column given is the reference (the event's driver). For each column prints
median and spread before vs inside the window, its correlation with the
reference at the best lag, and the raw values at onset.
"""
import csv, sys, os, statistics as st


def find_data(argv):
    """The folder holding unit_*.csv: given with --data, or found in the CURRENT directory.

    Never derived from this file's location. scripts/launch.sh mounts the skills at
    /opt/guard/skills, so walking up from __file__ landed on /opt; and on the host it
    pointed at data/, which is gitignored and holds no unit CSVs, so the command this
    skill documents raised FileNotFoundError on a clean checkout.
    """
    if "--data" in argv:
        return os.path.abspath(os.path.expanduser(argv[argv.index("--data") + 1]))
    here = os.getcwd()
    for cand in ("sensordata", "data", "."):
        p = os.path.join(here, cand)
        if os.path.isdir(p) and any(f.startswith("unit_") and f.endswith(".csv") for f in os.listdir(p)):
            return os.path.normpath(p)
    sys.exit("no unit_*.csv found in %s (looked in sensordata/, data/ and the current "
             "directory); pass --data DIR" % here)


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def load(data_dir, unit, cols):
    path = os.path.join(data_dir, unit + ".csv")
    series = {c: [] for c in cols}
    with open(path) as fh:
        for row in csv.DictReader(fh):
            for c in cols:
                series[c].append(num(row.get(c)))
    return series


def corr(a, b):
    pairs = [(x, y) for x, y in zip(a, b) if x is not None and y is not None]
    if len(pairs) < 3:
        return None
    xs, ys = [p[0] for p in pairs], [p[1] for p in pairs]
    mx, my = st.mean(xs), st.mean(ys)
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    if vx <= 0 or vy <= 0:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (vx * vy) ** 0.5


def best_lag(ref, v, lo, hi, span=3):
    """Correlation with ref at the lag that maximises |r|; positive lag = v follows ref."""
    best = (None, 0)
    for lag in range(-span, span + 1):
        a = ref[lo:hi + 1]
        b = v[lo - lag:hi + 1 - lag] if lo - lag >= 0 else None
        if b is None or len(b) != len(a):
            continue
        r = corr(a, b)
        if r is not None and (best[0] is None or abs(r) > abs(best[0])):
            best = (r, lag)
    return best


def stats(v, lo, hi):
    before = [x for x in v[:lo] if x is not None] if lo > 0 else []
    inside = [x for x in v[lo:hi + 1] if x is not None] if lo >= 0 else []
    return before, inside


def main():
    args = sys.argv[1:]
    data_dir = find_data(args)
    if "--data" in args:
        k = args.index("--data")
        args = args[:k] + args[k + 2:]
    if "--window" in args:
        k = args.index("--window")
        lo, hi = int(args[k + 1]), int(args[k + 2])
        args = args[:k]
    else:
        lo = hi = -1
    unit, cols = args[0], args[1:]
    series = load(data_dir, unit, cols)
    ref = series[cols[0]]

    print("%s   window [%d, %d]   reference = %s\n" % (unit, lo, hi, cols[0]))
    head = "%-8s %10s %10s %10s   %8s %8s   %s" % (
        "column", "med_before", "med_inside", "shift%", "sd_before", "sd_inside",
        "vs %s" % cols[0])
    print(head)
    print("-" * len(head))
    for c in cols:
        v = series[c]
        before, inside = stats(v, lo, hi)
        miss = sum(1 for x in v if x is None)
        if not (before and inside):
            print("%-8s  (window covers the whole file - no before/after to compare)" % c)
            continue
        mb, mi = st.median(before), st.median(inside)
        shift = (mi - mb) / abs(mb) * 100 if mb else float("nan")
        sb = st.pstdev(before) if len(before) > 1 else 0.0
        si = st.pstdev(inside) if len(inside) > 1 else 0.0
        if c == cols[0]:
            rel = "-"
        else:
            r, lag = best_lag(ref, v, lo, hi)
            rel = "r=%+.2f at lag %+d" % (r, lag) if r is not None else "n/a"
        print("%-8s %10.4g %10.4g %9.1f%%   %8.3g %8.3g   %s%s"
              % (c, mb, mi, shift, sb, si, rel, "  (%d missing)" % miss if miss else ""))

    if lo > 0:
        print("\nraw values around onset (sample %d):" % lo)
        idx = range(max(0, lo - 3), min(len(ref), lo + 4))
        print("%-8s %s" % ("sample", " ".join("%9d" % i for i in idx)))
        for c in cols:
            vals = ["%9s" % ("-" if series[c][i] is None else "%.4g" % series[c][i]) for i in idx]
            print("%-8s %s" % (c, " ".join(vals)))


if __name__ == "__main__":
    main()
