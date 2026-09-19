---
name: analyze
description: Audit a folder of undocumented process data end to end and write reports/<filename>.json per file plus reports/summary.md - inferring what each column is, and separating real process faults from instrument and record problems. Use when asked to analyse, audit or profile unlabelled process/sensor files, or to produce the plant_audit reports. A fast low-accuracy pass is available for demos.
---

# Process fault analyst

You get a folder of undocumented process data, as separate files. Find where
the process genuinely changed, explain what caused it, and name every
variable that responded. Also flag anything that's an instrument or record
problem rather than a real process change — an operator needs to know which
channels to distrust, separately from what the plant actually did. Run end
to end, no clarifying questions.

**The data is in the workspace this pi instance was given with `/workspace`** —
the absolute path is in your system prompt, under `## Workspace`. Read the CSVs
from the first of `<workspace>/sensordata`, `<workspace>/data`, or the workspace
root itself that holds them, and write every report inside that same workspace.
Do not resolve paths against this skill's own location — it may be installed
outside the workspace — and do not use the working directory, which pi requires
to sit *outside* the workspace, so writes there are blocked. Every `reports/...`
path below means `<workspace>/reports/...`. If no workspace is set, stop and ask
the user to run `/workspace <folder>`.

If the person asks for speed over accuracy — a demo, a smoke test, "just get
something out" — follow `references/fast-pass.md` instead of the rest of this
file. Otherwise ignore it.

Check whether the files actually share a source before treating them as
comparable — matching columns, matching value ranges and operating levels
across files is evidence they do; don't assume it up front. Once verified,
use every file's evidence together to pin down what each column is — more
data makes that inference stronger. Faults are still a per-file question:
what's wrong in one file says nothing about another.

## How to work
Write one script that profiles every file and prints the statistics you need,
then reason over that output. Never read a CSV directly with a file-reading
tool (Read, cat, head, etc.) - they are large, and the point is to compute
statistics, not to look at rows. Do not open files by hand or make a tool call
per column.

Use the Python 3 standard library only — `csv`, `statistics`, `math`. Do not
create a virtualenv and do not install anything. The files are a few hundred
KB each; this runs in seconds without pandas or numpy.

Write `reports/<filename>.json` as you finish each file, not all at once at
the end. Then write `reports/summary.md` last. The whole job should take
minutes.

`<filename>` is the source file's full name, extension included: `unit_01.csv`
becomes `reports/unit_01.csv.json`, not `reports/unit_01_analysis.json` or any
other variant. `audit`'s `build_session.py` globs for exactly
`reports/unit_*.csv.json` and silently finds nothing otherwise.

## Two computations, reused for everything
Run both once per file; every question below is a lookup against one of them,
not a fresh analysis.

**A. Cross-column table** — pairwise correlation between every column at lags
-3..+3 samples over a clean stretch. Keep each column's best-correlated
partner(s) and which one leads.
- **which columns are coupled** → propagation and variable attribution
- **which columns lead, which lag** → a starting point for `role` (see below)
- **a column with no coupled partner moving** → not a real process change

**B. Per-column window table** — split each column into ~10 equal blocks and
track its own median, variance, and lag-1 autocorrelation of successive
differences per block. Compare early blocks to late blocks.
- **median shifts, coupled partner shifts too (table A)** → real fault, layer
  `system`
- **median shifts, no partner shifts** → `measurement`, `bias_step`/`drift`
- **variance or autocorrelation shifts with the median flat** →
  `measurement`, `variance_inflation`/`added_lag`/similar — table A won't
  show this, it only sees shared movement, not a column's own noise changing

## Column identity
- `role`: a genuine actuator is a *cause* — several other columns should lag
  behind it, not just one, and it often sits at a physical operating limit
  now and then (saturates) rather than wandering freely. Leading a single
  partner is weak evidence on its own: check whether that "lead" survives
  once you account for the column's own update rate — a slowly-sampled
  column can look like it leads a fast one for no reason other than its own
  sampling, which isn't causality. Weigh these together rather than keying
  off any one of them, and when the evidence doesn't clearly point one way,
  say `observed` at low confidence rather than guess — a wrong confident
  label is worse than an honest uncertain one.
- `type`: use the column's own dynamics, not just its range — level
  ramps/drifts like an integrator, pressure and flow track their driver
  almost immediately, temperature shows a visible lag before settling,
  composition is bounded and noisier. Combine with typical magnitude ranges.
- `sample`/`timestamp`-style counters are `role: index` — no further
  reasoning needed there.

## Faults
- `record` — wrong as written: missing values, absent rows, frozen channels,
  duplicate rows, impossible values, a scale that changes mid-file.
- `measurement` — table B shows a shift (median, variance, or
  autocorrelation) in one column, and table A shows no coupled partner
  moved with it.
- `system` — table B shows a shift, and table A shows coupled partners
  shifted too, with a lag.

Rule out `record` first — a bad record can masquerade as a fault below it.
If a `system` fault moves more than one variable, write one `findings` entry
per variable, all sharing the `window`, `fault_type`, and `onset_estimate`;
say in each one how it's coupled to the primary variable.

## Rules
- Infer what the columns mean from the data — that is the task, not a
  question you ask.
- Name the evidence for every claim and put a confidence on it. A hedged
  inference that shows its reasoning beats a confident label that shows none.
- A clean file is a valid result. Say so and move on.
- Some real faults leave the mean and variance almost unchanged — don't force
  a finding if the evidence isn't there.
- Never read `truth/` or `labels/`.

## Output
`reports/<filename>.json`:
```json
{
  "schema": [
    {"column": "", "type": "", "role": "observed|actuated|index",
     "confidence": 0.0, "evidence": ""}
  ],
  "findings": [
    {"column": "", "window": [0, 0], "layer": "record|measurement|system",
     "fault_type": "", "onset_estimate": 0, "confidence": 0.0, "evidence": ""}
  ]
}
```
`reports/summary.md`: one plain line per file, written for an operator.

These reports are what the `audit` skill reads out to a person;
this skill produces them.
