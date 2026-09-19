---
name: audit
description: Read out a folder of analyse reports - the sensor set, then every fault and finding, file by file - so a person can get a grasp of undocumented process data. Use when someone wants to review an audit, see what was found, or drill into a specific unit or channel. Not for producing the audit itself.
---

# Sensor walkthrough

Turn the reports in `<workspace>/reports/` into one short report. Same shape
every run. Reports are read-only.

**Everything you say comes from the reports in front of you.** This skill
carries no facts about any plant, dataset, tag or file. If a number, a tag
name, a coefficient or a verdict is not in the session you just read, you do
not have it: leave it out. Do not fill a gap from memory, from a previous
session, or from what a dataset of this kind usually looks like.

Two things never to say:

- **What a column measures.** Columns here are unlabelled and `analyze` writes
  `type: "unknown"`. Report behaviour ("ramps instead of settling"), never
  identity ("is a level"). A `type` other than `unknown` or `counter` is stale
  output from an older run - ignore the field.
- **Anything the session does not carry.** Null fields get dropped from the
  output, not guessed at.

Do not interview the person and never end on a question back to them.

## Setup

```bash
python3 .pi/skills/audit/build_session.py --workspace /abs/path/to/workspace
```

`--workspace` is required: the folder this pi instance was given with
`/workspace`, named in your system prompt under `## Workspace`. The skill may
be installed outside the workspace, so its own location is never used to find
`reports/`.

Writes `<workspace>/reports/walkthrough/session.json`. Read that file, not the
raw reports. `reports/summary.md` is optional enrichment - without it `rows`,
`summary_line` and `clean_rationale` come back null. Do not ask for one to be
written.

If `session.json` has no units, say the reports folder is empty or unreadable
and stop.

## The report

Default output, unless they asked for one specific thing (see below). Nothing
before it, nothing after it. Every value comes from `session.json`.

```
## Audit - {n_units} files, {n_events} events, {n_clean} clean

{one line per schema `evidence` entry that states an update rate, an exact
relationship between two columns with its residual, a column that integrates
rather than settling, or one that saturates. Reports' own terms, only where a
report says so. Nothing else from the schema - an entry saying a column is not
inferable from unlabelled data carries nothing and is skipped. Skip the whole
section if that leaves it empty.}

| File | Rows | Verdict | Layers | Events | What |
|---|---|---|---|---|---|
| unit_01 | 8640 | clean | - | 0 | {clean_rationale, else "clean"} |
| unit_02 | 8640 | faulted | record | 2 | {each event's fault_type, joined "; "} |

Clean rows first, then record, then measurement, then system.
Drop the Rows column entirely if `rows` is null throughout.

### What was found

| Event | Fault | Driver | +cols | Window | Why |
|---|---|---|---|---|---|
| unit_03:e1 | step_change | tag_07 | 3 | 4100-4400 | {evidence[primary_column], verbatim} |

Only the events that carry something the inventory does not:

- every `system` event - coupled channels moved together
- every event with `n_columns` > 1
- nothing else individually.

Ordered by severity, then unit. The Why column is the driver's own `evidence`
string from the session, quoted as written and not paraphrased - it is the
report's explanation of the call, and it is the reason this table exists.

Then one line per remaining fault_type, rolled up rather than tabled:

```
9 more single-column record faults: impossible_value (unit_04, unit_06, ...),
frozen_channel (unit_11).
```

Two columns are conditional, not default: add **Severity** only when the
selected events do not all share one, and **Confidence** only when they do not
all share one value - in a set where every finding scored the same, a column
repeating it says nothing. When confidence is below 0.5, say so once under the
table instead.
```

Then stop. That is the whole default report - no per-file tour, no summary
paragraph, no next steps.

Two lines may be added after the tables when the session supports them, one
sentence each, otherwise omitted:

- A channel appearing in several files: name it and count the files. A
  `record` fault is a property of one file - never generalise those.
- Whether the files are the same sensor set: only if identical column names
  plus an exact relationship reproduce across every file, per the schema
  evidence. Otherwise say nothing.

## Per file - only when asked

For a named unit, or for all of them in `teaching_order` if they ask for the
full tour. Per event: one sentence from `layer` + `fault_type`, the driver and
the count of coupled columns, window and onset, severity, and the driver's
`evidence` quoted. Quote a coupled column's `evidence` too when it says
something different from the driver's; skip it when it repeats. For a clean
file, `clean_rationale`, or just that it came back clean.

## Evidence on demand

When an event needs backing, or someone doubts a call:

```bash
python3 .pi/skills/audit/show_window.py --workspace /abs/path/to/workspace <unit> <ref_column> <other columns...> --window <start> <end>
```

First column is the reference - use the event's `primary_column`, and take the
window from the event. Prints median and spread before vs inside the window,
each other column's correlation with the reference at its best lag, and the raw
values at onset. Show numbers, not sparklines. The event's `evidence` field
holds the audit's own prose per column; quote it when it adds something the
numbers do not.

## Answering a specific question

A single tag, a single file, a yes/no, a number: answer only that, in whatever
form fits. No tables, no orientation. Pull it from `session.json`; if it isn't
in there, say so.

## Notes file

If they correct something or supply a real tag name, append it to
`reports/walkthrough/notes.json` and carry it forward for the rest of the
session. Do not solicit it. Notes are the only place real tag identities ever
come from - never reconstructed from the data.
