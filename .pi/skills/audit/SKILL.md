---
name: audit
description: Read out a folder of analyse reports - the sensor set, then every fault and finding, file by file - so a person can get a grasp of undocumented process data. Use when someone wants to review an audit, see what was found, or drill into a specific unit or channel. Not for producing the audit itself.
---

# Sensor walkthrough

Turn the reports in `<workspace>/reports/` into text a person can read.
Reports are read-only.

**Everything you say comes from the reports in front of you.** This skill
carries no facts about any plant, dataset, tag or file — it describes how to
present reports, never what they contain. If a number, a tag name, a
coefficient or a verdict is not in the reports you just read, you do not have
it: say so, or leave it out. Do not fill a gap from memory, from a previous
session, or from what a dataset of this kind usually looks like.

Do not interview the person. State the findings and the evidence for them. If
they want to correct or annotate something they will say so; record that in
`reports/walkthrough/notes.json` and move on. Never end a section with a
question back to them.

## Setup

```bash
python3 .pi/skills/audit/build_session.py --workspace /abs/path/to/workspace
```

`--workspace` is required: it's the folder this pi instance was given with
`/workspace`, named in your system prompt under `## Workspace`. The skill may
be installed outside the workspace, so its own location is never used to find
`reports/`.

Writes `<workspace>/reports/walkthrough/session.json`, which regroups the
per-column findings into whole events and adds four things the report schema
does not carry: the driver column for each event, the reasoning for the clean
files, a severity, and a teaching order. Read that file, not the raw reports.

`reports/summary.md` is **optional**. It is prose enrichment, not an input the
walkthrough depends on: when it is there, the session picks up each file's row
count, its one-line description, its named driver and its clean-file rationale
from it. When it is absent — or written in some other shape than the parser
expects — the session still builds, the driver is derived from the findings'
own `evidence` and confidence, and `rows`, `summary_line` and `clean_rationale`
come back `null`. Do not stop, and do not ask for a summary to be written:
present what `session.json` carries and leave out the fields that are null.

If `session.json` has no units in it, say the reports folder is empty or
unreadable and stop. Do not describe an audit that isn't there.

## 1. Orientation - once, at the start

A short read of `column_schema` and the session totals: how many files, how
many columns, how many events, how many files came back clean.

Then whatever the schema `evidence` fields actually establish about the
columns — an update rate, an exact redundancy between two columns, a column
that integrates rather than settling, a column that saturates. Report these in
the reports' own terms and only where a report says so.

Two things to hold to here:

- **Do not say what any column measures.** Columns in undocumented data are
  unlabelled, and `analyze` does not guess a physical quantity — it writes
  `type: "unknown"`. Pass that through. Never present a type census ("so many
  temperatures, so many flows"); if a report carries a `type` other than
  `unknown` or `counter`, it is stale output from an older run — ignore the
  field rather than repeat it.
- **Distinguish behaviour from identity.** "this column ramps
  instead of settling" is something a report measured. "this column is a level"
  is a guess. Say the
  first, never the second.

If a report states an exact relationship between two columns, repeat it with
its residual and say plainly that both should never go into the same model.

## 2. Inventory - the whole dataset on one screen

A compact table of every file: unit, rows, verdict, layers present, event
count, and a one-line description of each event. This is the main deliverable
- most people want the inventory, not a guided tour. Drop the rows column if
`rows` is null throughout: that only means no summary.md was parsed, not that
anything is missing from the audit.

Group it by layer so the shape is visible - clean files first, then:
- **record** faults - the file is wrong as written
- **measurement** faults - one channel moved, nothing coupled to it did
- **system** faults - coupled channels moved together, the plant really changed

Which files are clean, and how many, comes from the session. Do not carry a
list of clean files between sessions.

## 3. Per file - on request, or in `teaching_order` if they want all of it

`teaching_order` runs clean files first, then record, measurement, system, with
the most stacked file last. Following it means every file builds on the
previous one - but if they ask for a specific unit, just go there.

For each file state the verdict and event count, then each event:

- what happened, in one sentence, from `layer` + `fault_type`
- **the driver first** (`primary_column`), then the coupled columns as a group.
  Never enumerate them individually - say how many and name the driver.
- window and onset
- confidence and severity, and say plainly when confidence is low
- for a clean file, `clean_rationale` - what nearly looked like a fault and why
  it was not. If it is null, say the file came back clean and leave it there.

## 4. Evidence on demand

When an event needs backing, or someone doubts a call:

```bash
python3 .pi/skills/audit/show_window.py --workspace /abs/path/to/workspace <unit> <ref_column> <other columns...> --window <start> <end>
```

First column is the reference - use the event's `primary_column`, and take the
window from the event. Prints median and spread before vs inside the window,
each other column's correlation with the reference at its best lag, and the raw
values at onset. Show numbers, not sparklines.

The `evidence` field on each event holds the audit's own prose per column;
quote it when it adds something the numbers do not.

## Cross-file statements

Only make one when the session supports it. Whether the files are even the same
sensor set is a claim to check, not assume - identical column names plus an
exact relationship reproducing across every file is what would establish it,
and `analyze` records that in the schema evidence if it found it.

When a channel appears in several files, say which ones, counted from the
session. Exception: a `record` fault is a property of that one file, not the
plant - do not generalise those.

## Answering a specific question

If someone asks for a specific piece of data - a single tag, a single file, a
yes/no, a number - answer only that, in whatever form fits the question. Do
not wrap it in the orientation, inventory, or per-file walkthrough format
above; those apply when giving a tour of the audit, not when someone wants one
fact. Pull it from `session.json`. If it isn't in there, say so.

## Notes file

If they correct something or supply a real tag name, append it to
`reports/walkthrough/notes.json` and carry it forward for the rest of the
session. Do not solicit it. Notes are the only place real tag identities ever
come from - they are supplied by a person, never reconstructed from the data.
