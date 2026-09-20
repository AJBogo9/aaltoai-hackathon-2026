---
name: read-report
description: Read out the plant_audit reports - the sensor set, then every fault and finding, file by file - so a person can get a grasp of 52 unlabelled sensors. Use when someone wants to review the audit, see what was found, or drill into a specific unit or channel. Not for producing the audit itself.
---

# Sensor walkthrough

The reports in `reports/` describe 18 recordings of the same 52 sensors. Present
what they found, clearly and in order. Reports are read-only.

Do not interview the person. State the findings and the evidence for them. If
they want to correct or annotate something they will say so; record that in
`reports/walkthrough/notes.json` and move on. Never end a section with a
question back to them.

## Setup

```bash
python3 .pi/skills/read-report/build_session.py
```

Writes `reports/walkthrough/session.json`, which regroups the 158 per-column
findings into 21 whole events and adds four things the report schema does not
carry: the driver column for each event, the reasoning for the clean files, a
severity, and a teaching order. Read that file, not the raw reports.

## Before you start: three known errors

The reports contain three wrong claims. Correct them where they come up; never
repeat them as fact.

1. **`tag_02` / `tag_11` are not a redundant pair.** The summary says
   `tag_11 = tag_02/100`. The real ratio is ~98 and drifts per file, residuals
   3.6-4.8% of range. Coupled, not duplicates.
2. **`tag_08` / `tag_19` is approximate, not exact** - ~2% residual, coefficient
   varies per file.
3. **`tag_15`, `tag_16`, `tag_17`, `tag_51` are not actuators.** The summary
   lists them as actuated *and* as 6-min assays. They update on a strict
   2-sample grid, so the apparent "lead" is a sampling artifact. Only `tag_14`
   and `tag_36` are defensible.

The two redundancies that do hold exactly, in all 18 files:
`tag_01 = 0.4321*tag_20 + 29.893` and `tag_21 = 0.3398*tag_31 + 37.053`
(max residual 0.0013 over all 18 files). Never feed both into a model.

## 1. Orientation - once, at the start

From `column_schema`, which is identical in all 18 reports:

- 52 tags. By type: 19 composition, 12 flow, 11 temperature, 3 level, 2 pressure.
- **Three update rates:** 33 continuous, 14 on a 2-sample (6 min) grid, 5 on a
  5-sample (15 min) grid. The sampled ones look frozen but are not - a repeat
  run at its own period is normal, a run *longer* than the period is a miss.
  Say this early; it is the most confusing thing about the data.
- The two exact redundant pairs above.
- Levels (`tag_08`/`tag_19`, `tag_30`) integrate - they ramp instead of settling.
- `tag_48` sits slightly negative in every file. Normal, not a fault.

## 2. Inventory - the whole dataset on one screen

Then a compact table of all 18 files: unit, rows, verdict, layers present,
event count, and a one-line description of each event. This is the main
deliverable - most people want the inventory, not a guided tour.

Group it by layer so the shape is visible:
- **clean** files - take them from the session file's `verdict`, do not recite a
  fixed list: they differ per pass. In `hyvätraportit/` they are unit_12, 13, 15
  and 16; in the fast pass under `reports/` there are eight, and they are not the
  same four.
- **record** faults - the file is wrong as written
- **measurement** faults - one channel moved, nothing coupled to it did
- **system** faults - coupled channels moved together, the plant really changed

## 3. Per file - on request, or in `teaching_order` if they want all of it

`teaching_order` runs clean files first, then record, measurement, system, with
unit_07 last (five stacked events, including 24 frozen channels). Following it
means every file builds on the previous one - but if they ask for a specific
unit, just go there.

For each file state the verdict and event count, then each event:

- what happened, in one sentence, from `layer` + `fault_type`
- **the driver first** (`primary_column`), then the coupled columns as a group.
  Never enumerate 28 columns individually - say how many and name the driver.
- window and onset
- confidence and severity, and say plainly when confidence is low
- for a clean file, `clean_rationale` - what nearly looked like a fault and why
  it was not

## 4. Evidence on demand

When an event needs backing, or someone doubts a call:

```bash
python3 .pi/skills/read-report/show_window.py unit_04 tag_36 tag_49 --window 180 891
```

First column is the reference - use the event's driver. Prints median and spread
before vs inside the window, each other column's correlation with the reference
at its best lag, and the raw values at onset. Show numbers, not sparklines.

The `evidence` field on each event holds the audit's own prose per column; quote
it when it adds something the numbers do not.

## Cross-file facts worth stating

All 18 files are the same 52 sensors - the affine coefficients above are
identical to four decimals in every file, which is what proves it. So a channel
fact is a plant fact.

36 of the 49 flagged channels appear in more than one file; `tag_36`, `tag_22`,
`tag_13`, `tag_47` each appear in five. When listing a channel, say where else
it shows up. Exception: a `record` fault is a property of that one file, not the
plant - do not generalise those.

## Answering a specific question

If someone asks for a specific piece of data - a single tag, a single file, a
yes/no, a number - answer only that, in whatever form fits the question. Do
not wrap it in the orientation, inventory, or per-file walkthrough format
above; those apply when giving a tour of the audit, not when someone wants one
fact. Still correct any of the three known errors if they touch the answer,
and still pull from `session.json` rather than the raw reports.

## Notes file

If they correct something or supply a real tag name, append it to
`reports/walkthrough/notes.json` and carry it forward for the rest of the
session. Do not solicit it.
