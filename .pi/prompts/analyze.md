---
description: Full-accuracy audit of a folder of undocumented process data - writes reports/<file>.json per file plus reports/summary.md
argument-hint: "[optional: which folder / extra instructions]"
---
Use the `analyze` skill to audit the undocumented process data in the workspace
end to end, and write `reports/<filename>.json` per file plus `reports/summary.md`
inside the workspace.

Follow that skill's SKILL.md exactly. Accuracy matters here: do the real per-file
reasoning, and do not take the fast pass in `references/fast-pass.md` unless the
extra instructions below explicitly ask for speed over accuracy.

Extra instructions from the user (may be empty): $ARGUMENTS
