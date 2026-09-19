---
name: analyze-fast
description: Fast low-accuracy audit of a folder of undocumented process data - writes reports/<filename>.json per file plus reports/summary.md in the same format as analyze, by fixed rules instead of reasoning. Use for demos, smoke tests, or "just get something out" when accuracy does not matter. Use analyze instead whenever the labels have to be right.
---

# Fast fault pass (demo quality)

Speed over accuracy. One script, one run, done in seconds. The output has the
same shape as `analyze`, so the walkthrough skills read it unchanged -
but the labels are guesses and most of them are wrong.

**Do not use this for anything anyone will act on.** If the person wants a real
audit, use `analyze`.

## Do exactly this

Pass the workspace folder this pi instance was given with `/workspace` — it is
named in your system prompt, under `## Workspace`:

```bash
python3 .pi/skills/analyze-fast/fast_report.py --workspace /abs/path/to/workspace
```

Then stop. Do not read the output, review it, spot-check it, or improve it.
Do not reason file by file. Do not iterate. The whole job is one command and
takes a few seconds.

Report back: how many files were written, where, and that the pass was
low-accuracy. Nothing else.

## Where the data comes from

**Everything is resolved inside the workspace, not next to this skill file.**
The skill can be installed anywhere — a shared `.pi/`, another checkout — so its
own location says nothing about where the data is.

`--workspace` is required and has no fallback, on purpose:

- pi keeps the workspace in memory and surfaces it **only in the system
  prompt**. There is no env var and no config file to read, so the script
  cannot find it on its own.
- The working directory is not a substitute: pi rejects a workspace that
  contains cwd, so cwd sits *outside* the workspace.

Given the workspace, the script resolves:

- **Input** — first of `<workspace>/sensordata`, `<workspace>/data`, or
  `<workspace>` itself that contains `*.csv`. Override with `--in DIR`.
- **Output** — `<workspace>/reports`. Override with `--out DIR`.

Both are checked to be inside the workspace (symlinks resolved) and the run is
refused otherwise — pi's confidentiality broker would block the write regardless, so
failing early gives a clearer message. Writing into `hyvätraportit/` is refused
unless you pass `--force`: that folder holds the hand-checked reports and demo
output must not overwrite them.

`sensor-walkthrough` reads `reports/`, so the default output pairs with it.
`sensor-walkthrough-2` reads `hyvätraportit/` and is **not** the right consumer
for this skill's output.

## The rules the script applies

No thresholds below are tuned. They were picked once and left alone.

**schema** - one entry per column, by rule:

- `sample` / `timestamp` → `role: index`
- everything else → `role: observed`, and `type` bucketed from the column's
  median magnitude: >1000 flow, >100 temperature, >10 level, >1 pressure,
  else composition
- every entry gets `confidence: 0.3`, `evidence: "range-based guess"`

No column is ever labelled `actuated` - the fast pass has no lead/lag analysis
to justify it.

**findings** - a column is flagged only when something is obvious in a single
pass:

| trigger | layer | fault_type |
|---|---|---|
| empty / unparseable cells | `record` | `missing_values` |
| 8+ identical consecutive values | `record` | `frozen_channel` |
| value >12 robust sigma from the median | `record` | `impossible_value` |
| biggest block-median jump ≥4 sigma, alone in its block | `measurement` | `bias_step` |
| same, but 3+ columns jump in the same block | `system` | `step_change` |

Each column is split into 10 equal blocks; `window` is the block bounds and
`onset_estimate` the block start. Findings are capped at 6 per file, sorted by
onset. Every finding gets `confidence: 0.3`. An empty `findings` list is a fine
result.

## Known limitations - state these if asked, do not fix them

- The `measurement` / `system` split is a column count in one block, not a
  coupling test. Correlation and lag are never computed, so attribution is
  guesswork and a genuine propagating fault is usually split across the wrong
  layers.
- Faults that leave the median flat - variance inflation, added filtering, a
  changed noise floor - are invisible here. Only block medians are compared.
- Slowly-sampled channels that legitimately repeat every 2nd or 5th sample can
  trip `frozen_channel` if the run crosses 8 samples.
- A real process excursion trips `impossible_value`, because the rule is a
  distance from the median with no notion of whether anything moved with it.
- One event spanning many columns produces many separate findings with no
  shared window or driver.

## Output format

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

`reports/summary.md`: one line per file, written by the same script.

Never read `truth/` or `labels/`.
