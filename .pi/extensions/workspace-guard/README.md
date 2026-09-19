# workspace-guard

A [pi](https://pi.dev) extension that confines the agent to one folder, the **workspace**, and stops
data from flowing to a model provider that is not cleared for it.

- The agent can only read and write inside the workspace you choose with `/workspace <folder>`.
- The workspace carries **one confidentiality label**. Every file and folder in it has that label.
- Each provider has a **clearance**. A provider may only work in a workspace whose label is at or
  below its clearance.
- Anything the agent produces stays in the workspace, so it inherits the label. Data never moves to a
  lower label.

This is a proof-of-concept **guardrail**, not a sandbox. See [Limits](#limits).

## Quick start

1. **Define levels and provider clearances** in `.pi/confidentiality.json` (repo root):

   ```json
   {
     "levels": ["public", "confidential", "restricted"],
     "providers": {
       "google": "public",
       "my-openai": "confidential",
       "ollama": "restricted"
     }
   }
   ```

   `levels` runs from lowest to highest. `providers` maps a pi provider id to the highest level that
   provider may see. A provider that is not listed gets the lowest level.

2. **Label a workspace folder** with `<folder>/.confidentiality.json`:

   ```json
   { "level": "confidential" }
   ```

3. **Start pi** from the repo root and run:

   ```text
   /workspace path/to/folder
   /confidentiality
   ```

A ready-made example is in `data/mock-workspace/` (gitignored, so it exists only on your machine).

## Concepts

| Term | Meaning |
|---|---|
| **Level** | A named confidentiality level from `levels`, ordered lowest to highest. |
| **Workspace label** | The single `level` in the workspace's `.confidentiality.json`. |
| **Clearance** | The level configured for the current provider. |
| **Session level** | The highest level the session has read so far. It only goes up, and starts at the lowest level. |

A provider is cleared for a workspace when its clearance is **the same as or higher than** the
workspace label.

## Commands

| Command | What it does |
|---|---|
| `/workspace <folder>` | Sets the workspace. Prints the label, the provider's clearance and the session level. |
| `/workspace` | Opens a picker of the folders under the project that have a valid `.confidentiality.json`, with their labels. `✗ no access` marks folders the current provider may not use, and `(current)` the active one. Without a UI it just reports the current workspace. |
| `/confidentiality` | Shows the workspace label, whether the current provider may use it, and the session level. |
| `/prompt` | Prints the system prompt as it will be sent next, and saves it to `~/.pi/agent/last-system-prompt.txt`. |

`/workspace` refuses when:

- the folder does not exist, or is the project folder or one of its parents;
- the folder is inside `.pi`, `.git`, `.devcontainer` or `.claude`, or contains the policy file;
- there is no `.pi/confidentiality.json` or it is invalid;
- the folder has no `.confidentiality.json`, or it is invalid. Keys other than `level` are refused, and
  `level` must be one of the policy's levels.

Slash commands are user input, so the model cannot run them or change the workspace.

The picker searches up to three folders deep. It skips hidden folders, symlinks, `node_modules` and common
build folders, and lists at most 50 folders.

## Footer status

The footer always shows the state, in one line:

```text
● mock-workspace [confidential]  ·  google [public] ✗ no access  ·  session public
```

| Part | Meaning |
|---|---|
| `● workspace [label]` | The workspace and its label. The dot is green when the current provider may use it and red when it may not. `○ no workspace` shows before you set one. |
| `provider [clearance]` | The current provider and its clearance, with `✓` or `✗ no access` for the workspace. |
| `session level` | The highest level read so far. `⛔ messages withheld` is added when it is above the provider's clearance. |

Levels are colored from green (lowest) through yellow to red (highest). The line refreshes on `/workspace`, when
the model changes, when a read raises the session level, on session start and on each message.
`✗ confidentiality unusable` means the policy or the workspace metadata could not be read. Run
`/confidentiality` for the reason.

Set `NO_COLOR` to get the same text without colors. The status is cosmetic, so a failure to draw it never blocks
a tool call.

## Rules on every tool call

Tools are grouped in `rules.ts`:

| Group | Tools | Behavior |
|---|---|---|
| Read-only | `read`, `ls`, `grep`, `find` | Confined to the workspace. |
| File-changing | `write`, `edit` | Confined to the workspace and restricted as below. |
| Blocked | `bash` | Always refused. |
| Anything else | | Refused. |

**All file tools**

- No workspace set, an unusable policy or a missing or corrupt metadata file means every file tool is
  refused.
- A provider cleared **below** the workspace label gets no access at all, including `ls` and `find`.
- Paths are normalised the way pi does it (leading `@`, unicode spaces, `~`), resolved to real paths so
  `..` and symlinks are followed, and must end up inside the workspace. The tool then runs on exactly
  the path that was checked.
- For `ls`, `find` and `grep`, an omitted path means the workspace folder.

**Reading**

- `read`, `grep` and `edit` raise the session level to the workspace label. `ls` and `find` return names
  only and do not.

**Writing**

- The provider must be cleared for the workspace label. This prevents writing into a workspace above
  the provider's clearance.
- The session level must not be above the workspace label. This prevents writing down: data read in a
  more confidential workspace cannot be written into a less confidential one.
- Existing files are **read-only source data**. The agent may create new files and change files it
  created in the current session.
- `.confidentiality.json` is protected at every depth and can only be changed by you.
- The workspace folder itself cannot be a write target.

## Provider switches

The session level is what the model has already seen, so switching provider mid-session matters.

- **Messages.** If the session level is above the current provider's clearance, the next message is
  withheld ("Message withheld: ..."). Slash commands still work, so you can `/model` back or `/new`.
- **Model selection.** Pi does not let extensions veto a model switch. The extension switches back to
  the previous model, and warns you.

## Session state

The workspace, the session level and the list of files the agent created are saved in the session as a
`confidentiality` entry, so they survive `/reload` and resume. On start:

- **Resume and reload:** everything is restored. A saved workspace that no longer validates is not
  restored, and you are told why.
- **`/new`:** the session level and the created-file list reset. The workspace is kept.

## System prompt

On every message the extension appends a `## Workspace` section to the system prompt. It tells the
model:

- the workspace folder and the tool rules above;
- the workspace label, the session level, and the current provider's clearance;
- that a blocked call should be reported to you and not worked around.

The section is regenerated from the current state each turn. `/prompt` shows what will be sent.

## Failing closed

Access is refused, and the model is told why, when the policy or the metadata file is missing,
unreadable or invalid, when no workspace is set, and when the provider is unknown to the policy and the
workspace label is above the lowest level.

## Limits

- **A guardrail, not a sandbox.** It works through pi's tool hooks. The container remains the real
  boundary.
- **Clearances are declarations.** Nothing verifies that a provider really is local or EU-hosted. Levels
  attach to the provider id, not to the endpoint or the model.
- **The session level is coarse.** It is a high-water mark, not a track of what influenced what. Once
  you have read confidential data, everything written is confidential. Start a `/new` session to reset
  it.
- **Some input is unlabeled:** text you type, pasted content, and files pi loads on its own such as
  `AGENTS.md`.
- **`grep` and `find` and symlinks.** A symlink inside the workspace that points outside is refused for
  `read`, but I did not verify whether pi's `grep` and `find` follow symlinks when scanning a folder.
  Only you can create symlinks, because `bash` is disabled and the agent cannot make them.
- **`find` patterns.** I did not check whether a `find` pattern containing `..` can list names outside
  the workspace. It would reveal names only.
- **`.gitignore`.** Pi's `grep` and `find` respect `.gitignore`, so a workspace under the gitignored
  `data/` may look empty to them. `read` is not affected.
- **Time of check.** A file changed on the host between the check and the read is not noticed.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Wires everything into pi: commands, `tool_call`, `input`, `model_select`, `session_start` and `before_agent_start` handlers, session saving. |
| `gate.ts` | The decisions: `decideRead` and `decideWrite`. |
| `policy.ts` | Loads and validates `.pi/confidentiality.json`, and compares levels. |
| `metadata.ts` | Loads and validates the workspace's `.confidentiality.json`. |
| `workspace.ts` | What `/workspace` requires, and the summary lines. |
| `discover.ts` | Finds workspace folders for the `/workspace` picker. |
| `status.ts` | Builds the footer status line. |
| `paths.ts` | Path resolution, path normalisation and the workspace folder checks. |
| `prompt.ts` | Builds the system prompt section. |
| `rules.ts` | The tool lists. Enforcement and the prompt both read them, so they cannot drift. |
| `*.test.ts` | Tests. |

To let the agent use another tool, add its name to the right group in `rules.ts`. Anything not listed
is refused.

## Development

Run from this folder inside the container:

```bash
npm install          # first time only
npm run typecheck
npm test             # runs every *.test.ts with Node's built-in test runner
```

The tests use temporary folders and a fake pi object, so they need no model and no network. What they
cannot cover is pi's real behavior. Check these in a live session:

- `ctx.model.provider` holds the provider id used in the policy.
- `pi.setModel()` really switches back after a refused model change.
- The `input` handler's `handled` result really withholds the message.
- A message shown by `/prompt` matches what the model receives.
