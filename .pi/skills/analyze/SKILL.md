---
name: analyze
description: Audit a folder of undocumented process data end to end and write reports/<filename>.json per file plus reports/summary.md - characterising the columns, and separating real process faults from instrument and record problems. Use when asked to analyse, audit or profile unlabelled process/sensor files, or to produce the plant_audit reports. A fast low-accuracy pass is available for demos.
---

# Process fault analyst

You get a folder of undocumented process data, as separate files. Find where
the process genuinely changed, explain what caused it, and name every variable
that responded. Separately, flag anything that is an instrument or record
problem rather than a real process change. An operator needs to know which
channels to distrust, apart from what the plant actually did. Run end to end,
no clarifying questions.

## Where the data is

**The data is in the workspace this pi instance was launched on.** The absolute
path is in your system prompt, under `## Workspace`. Read the CSVs from the
first of `<workspace>/sensordata`, `<workspace>/data`, or the workspace
root itself that holds them, and write every report inside that same workspace.
Do not resolve paths against this skill's own location: `scripts/launch.sh`
mounts the skills read-only at `/opt/guard/skills`, so walking up from the
script lands on `/opt`. The working directory is safe to use: launch.sh starts
pi with `--workdir /workspace`, so cwd is the workspace root. Every `reports/...`
path below means `<workspace>/reports/...`. If no workspace is set, stop and tell
the user to exit and start pi with `scripts/launch.sh <folder>`; the workspace is
fixed at launch and cannot be changed during a session.

If the person asks for speed over accuracy (a demo, a smoke test, "just get
something out"), follow `references/fast-pass.md` instead of the rest of this
file. Otherwise ignore it.

## How to work

Profile the **whole folder in one pass**, then write the reports. One script
walks every CSV and prints the statistics you need for all of them at once; you
reason over that single output. Working a file at a time commits you to a
column's behaviour before you have seen the rest of the folder's evidence for
it, and costs a run per file for statistics one run already produced.

Use whatever analysis suits unlabelled multivariate time series: lagged
cross-correlation across all columns, per-column windowed statistics, whatever
else the data calls for. You know these methods; apply them and their usual
caveats. Then:

1. **One script, one run, every file.** Print the folder-wide statistics. Never
   read a CSV with a file-reading tool (Read, cat, head): they are large, and
   the point is to compute statistics, not to look at rows. Re-run only to add
   a statistic you are missing, and add it for every file at once.
2. **Settle the schema once, across all files.** A column is the same sensor in
   every file, so its `role` and its observed behaviour come from the pooled
   evidence and are then *identical in every report you write*, because `audit`
   reads the schema from one file and assumes it holds for the rest. First check the
   files really do share a source rather than assuming it.
3. **Then judge faults, per file.** This is the one genuinely per-file
   question: what is wrong in one file says nothing about another. Read it off
   the statistics you already printed.
4. **Then write all the reports**, one per input file, each carrying the shared
   schema and that file's own findings. `reports/summary.md` last.

Python 3 standard library only: `csv`, `statistics`, `math`. No virtualenv, no
installs. The files are a few hundred KB each, so the whole folder profiles in
seconds without pandas or numpy. The job should take minutes.

## What to report

A finding is something an operator would act on. Judge that, and say what
convinced you; the `layer` field is only how `audit` groups the result:

- `record`: the file is unusable as written, so a reader would draw the wrong
  conclusion from it.
- `measurement`: one channel moved and nothing coupled to it did, so distrust
  the channel, not the plant.
- `system`: coupled channels moved together, so the plant really changed.

Rule out `record` first: a bad record can masquerade as a fault below it. When
a `system` fault moves several variables, write one entry per variable sharing
the `window`, `fault_type` and `onset_estimate`, each saying how it couples to
the driver.

A clean file is a valid result, and so is a folder of mostly clean files.

## Column identity

- `type`: **do not infer it.** What a sensor measures is not recoverable from
  unlabelled numbers, and every guess made here has been wrong. Write
  `"unknown"` for every data column; name-matched `sample`/`timestamp` counters
  are `"counter"`, `role: index`. Real tag names come from a person, via
  `audit`'s notes file, and are never reconstructed.
- `role`: `actuated` only for a column the evidence says is a *cause*; when it
  does not clearly point one way, `observed` at low confidence.
- Put what you actually established in `evidence`, as behaviour rather than a
  label: that a column integrates instead of settling, updates on a fixed
  grid, leads or lags a named partner, saturates at a limit, or holds an exact
  affine relationship to another column (give the coefficients and the
  residual, and those two should never go into the same model).

## Output

`reports/<filename>.json`, where `<filename>` is the source file's full name,
extension included: `unit_01.csv` becomes `reports/unit_01.csv.json`. `audit`'s
`build_session.py` globs `reports/*.csv.json` and silently finds nothing
otherwise.

```json
{
  "schema": [
    {"column": "", "type": "unknown|counter", "role": "observed|actuated|index",
     "confidence": 0.0, "evidence": ""}
  ],
  "findings": [
    {"column": "", "window": [0, 0], "layer": "record|measurement|system",
     "fault_type": "", "onset_estimate": 0, "confidence": 0.0, "evidence": ""}
  ]
}
```

These are an interchange format for `audit`, which turns them into the text a
person reads, and nobody scrolls them. Keep them small:

- **One record per line, not pretty-printed JSON.** `indent=2` spends six lines
  per schema entry and pushes a 54-column file past 380 lines for no added
  information. Same JSON, ~6x fewer lines:
  ```python
  def dump_report(path, rep):
      j = lambda o: json.dumps(o, separators=(",", ":"), sort_keys=True)
      with open(path, "w") as fh:
          fh.write('{"schema":[\n')
          fh.write(",\n".join(" " + j(e) for e in rep["schema"]))
          fh.write('\n],"findings":[\n')
          fh.write(",\n".join(" " + j(e) for e in rep["findings"]))
          fh.write("\n]}\n")
  ```
- **`evidence` is one short sentence carrying the number that convinced you.**
  "median 0.42 -> 0.71 at block 6, no partner moved", not a paragraph.
- No fields outside the schema above; `audit` ignores them. An empty `findings`
  list is one line.

`reports/summary.md`: one plain line per file, written for an operator.

## Mark what you write

A report made from a labelled folder is as confidential as the folder. Mark it, so
the file says what it is when it is read somewhere else:

- Read `.confidentiality.json` in the workspace root for the level. If the folder has
  no label, write no marking. Never invent one, and never copy one from an example.
- `reports/summary.md` opens with the marking line, above the title:
  `` `RESTRICTED` · cleared: lemonade, ollama ``. The cleared providers are every
  provider in the policy whose clearance is that level or higher, lowest first. The
  policy is `$PI_POLICY_FILE`, and `.pi/skills/analyze-fast/fast_report.py` has the
  twenty lines that read both files if you want them.
- Each `reports/<file>.json` carries the same fact as its first key:
  `{"marking":{"cleared":["lemonade","ollama"],"level":"restricted"},` then `"schema"`.
  `audit` ignores keys it does not know.

## How to write

- No em dashes or en dashes. Use commas, colons, parentheses, or two sentences.
- Lowercase for machine words (`tag_19`, `restricted`, `unit_06.csv`), sentence case
  for prose. Levels and column names are values in a file, so they stay as the file
  spells them.
- Quote the number that convinced you rather than describing it.

Never read `truth/` or `labels/`.
