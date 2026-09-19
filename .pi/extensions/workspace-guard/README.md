# workspace-guard

A [pi](https://pi.dev) extension that runs the agent on one folder, the **workspace**, and stops data from
flowing to a model provider that is not cleared for it.

- The workspace is chosen **when pi is launched**, with `scripts/launch.sh <folder>`, and cannot change during the
  session.
- The workspace carries **one confidentiality label**, and the whole session is at that label from the first
  message, because the agent can only read and write inside the workspace.
- Each provider has a **clearance**. A provider cleared below the label gets **no tools and no messages**.
- The launcher runs pi in a container where **only the workspace is writable**, so the agent can use `bash` and
  Python without being able to reach anything else on the machine.

The extension is the policy layer. The container is the boundary. See [Limits](#limits).

## Quick start

1. **Define levels and provider clearances** in `.pi/confidentiality.json` (repo root):

   ```json
   {
     "levels": ["public", "confidential", "restricted"],
     "providers": { "google": "public", "mistral": "confidential", "ollama": "restricted" }
   }
   ```

   `levels` runs from lowest to highest. `providers` maps a pi provider id to the highest level that provider
   may see. A provider that is not listed gets the lowest level.

2. **Label a workspace folder** with `<folder>/.confidentiality.json`:

   ```json
   { "level": "confidential" }
   ```

3. **Launch** from the repo root, with the API keys of the providers you want in your shell:

   ```bash
   scripts/launch.sh demo/confidential-hr
   scripts/launch.sh --dry-run demo/confidential-hr        # check only, print the command
   scripts/launch.sh demo/confidential-hr -- --provider mistral
   ```

   Choose the provider with `/model` in pi, or after `--`. Ready-made fake workspaces are in `demo/`.

## Concepts

| Term | Meaning |
|---|---|
| **Level** | A named confidentiality level from `levels`, ordered lowest to highest. |
| **Workspace label** | The `level` in the workspace's `.confidentiality.json`, checked by the launcher. |
| **Clearance** | The level configured for the current provider. |
| **Session level** | Always the workspace label. Nothing in a session can raise or lower it. |

A provider is cleared for a workspace when its clearance is **the same as or higher than** the label.

## How a session starts

`scripts/launch.sh <workspace>`:

1. Checks the folder: it exists, does not contain the project folder, is not inside `.pi`, `.git`,
   `.devcontainer` or `.claude`, and has a `.confidentiality.json` that is a regular file.
2. Runs `preflight.ts` in the image with no network. It validates the policy and the label with the same code the
   extension uses.
3. Starts pi in a container. Only `/workspace` is writable, the label file is mounted read-only over itself, and
   the extension, the skills and the policy are read-only. The repo is not mounted. Pi is started with
   `--no-extensions -e <guard> --no-skills --skill <skills> --no-approve --no-context-files`, so nothing the
   workspace contains is loaded as an extension, skill or prompt.
4. Passes the settings to the extension:

   | Variable | Meaning |
   |---|---|
   | `PI_POLICY_FILE` | The policy. |
   | `PI_WORKSPACE` | The workspace folder. |
   | `PI_WORKSPACE_LEVEL` | Its label. The extension never re-reads `.confidentiality.json`. |
   | `PI_SANDBOXED=1` | pi runs in the launcher's container, so `bash` is confined. |

If a variable is missing or invalid, every tool is blocked and the footer says so. Outside the launcher, the
extension does nothing useful, on purpose.

## Commands

| Command | What it does |
|---|---|
| `/confidentiality` | Shows the workspace, its label, whether the current provider may use it, and the session level. |
| `/prompt` | Prints the system prompt as it will be sent next, and saves it to `~/.pi/agent/last-system-prompt.txt`. |

There is no `/workspace` command. To use another folder, start a new session with the launcher.

## Footer status

The footer always shows the state, in one line:

```text
● workspace [confidential]  ·  google [public] ✗ no access  ·  session public
```

| Part | Meaning |
|---|---|
| `● workspace [label]` | The workspace and its label. The dot is green when the current provider may use it and red when it may not. |
| `provider [clearance]` | The current provider and its clearance, with `✓` or `✗ no access`. |
| `session level` | The workspace label. `⛔ messages withheld` is added when it is above the provider's clearance. |

Levels are colored from green (lowest) through yellow to red (highest). Set `NO_COLOR` for plain text. The status
is cosmetic, so a failure to draw it never blocks a tool call. `✗ confidentiality unusable` means the launcher's
settings could not be used. Run `/confidentiality` for the reason.

## Rules on every tool call

Tools are grouped in `rules.ts`:

| Group | Tools | Behavior |
|---|---|---|
| Read-only | `read`, `ls`, `grep`, `find` | Confined to the workspace. |
| File-changing | `write`, `edit` | Confined to the workspace. `.confidentiality.json` is protected. |
| Shell | `bash` | Only when `PI_SANDBOXED=1`. Otherwise hidden from the model and refused. |
| Anything else | | Refused. |

- A provider cleared **below** the workspace label gets no tools at all, `bash` included.
- Paths are normalised the way pi does it (leading `@`, unicode spaces, `~`), resolved to real paths so `..` and
  symlinks are followed, and must end up inside the workspace. The tool then runs on exactly the path that was
  checked. Relative paths are relative to the workspace.
- `.confidentiality.json` cannot be written by the file tools at any depth, and the launcher mounts the real one
  read-only, so a script cannot change it either.
- The workspace folder itself cannot be a write target.
- Existing files can be changed: the workspace is writable.
- `bash` cannot be checked by path. The container is what keeps it inside the workspace.

**Session level.** The agent can only read and write inside the workspace, so the session is at the workspace label
from the start. There is nothing to raise or track.

## Provider switches

- **Messages.** While the current provider is cleared below the label, every message is withheld ("Message
  withheld: ..."), from the first one. Slash commands still work, so you can switch with `/model`. The default
  provider is often uncleared for a confidential workspace, so the first step is `/model <cleared provider>` or
  launching with `-- --provider <id>`.
- **Model selection.** Pi does not let extensions veto a model switch. Selecting an uncleared provider shows a
  warning. Nothing needs undoing, because that provider gets neither messages nor tools.

## Session state

The extension keeps no state in the session, so resume, `/reload` and `/new` all start at the workspace label.
Sessions are stored in `<workspace>/.pi-sessions`, so a transcript stays in the labeled folder and can only be
resumed in the same workspace.

## System prompt

On every message the extension appends a `## Workspace` section to the system prompt. It tells the model the
workspace folder, the tool rules above, the label, the session level and the provider's clearance, that `bash` runs
in a sandbox (or is disabled), that a blocked call should be reported and not worked around, and, for a provider
cleared below the label, that it has no tool access and should tell you to switch provider. The section is
regenerated each turn. `/prompt` shows what will be sent.

## Failing closed

Every tool is refused, and the model is told why, when the launcher's variables are missing or invalid, when the
policy is missing, unreadable or invalid, and when the provider is unknown to the policy and the workspace label
is above the lowest level.

## Limits

- **The container is the real boundary.** The extension enforces the policy through pi's hooks. With `bash`
  enabled, a command can do anything the container allows: read the whole workspace, use the network, and read the
  API keys that the launcher passes in.
- **Network access is open.** A script could send workspace data to any host it can reach. Restricting egress is
  not implemented.
- **Clearances are declarations.** Nothing verifies that a provider really is local or EU-hosted. Levels attach to
  the provider id, not to the endpoint or the model.
- **The session level is coarse.** The whole session is at the workspace label, whatever the model actually read.
- **Some input is unlabeled:** text you type, pasted content, and files pi loads itself. The launcher turns off
  `AGENTS.md`/`CLAUDE.md` loading and project-local extensions.
- **One label per workspace.** A `.confidentiality.json` in a subfolder is protected from the file tools but not
  honored: a nested folder with a higher label is still readable by any provider cleared for the root label. Keep
  workspaces flat.
- **`grep` and `find`.** Whether a `find` pattern with `..` can list names outside the workspace was not checked.
  Inside the container there is nothing outside the workspace worth listing. Pi's `grep` and `find` also respect
  `.gitignore`.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Wires everything into pi: commands and the `tool_call`, `input`, `model_select`, `session_start` and `before_agent_start` handlers. |
| `config.ts` | Reads and validates what the launcher sets: policy, workspace, label, sandbox flag. |
| `gate.ts` | The decisions: `decideRead`, `decideWrite` and `decideShell`. |
| `policy.ts` | Loads and validates `.pi/confidentiality.json`, and compares levels. |
| `metadata.ts` | Loads and validates a workspace's `.confidentiality.json`. |
| `preflight.ts` | The launch-time check run by `scripts/launch.sh`. |
| `workspace.ts` | The summary lines for `/confidentiality`. |
| `status.ts` | Builds the footer status line. |
| `paths.ts` | Path resolution and normalisation, and the write-path checks. |
| `prompt.ts` | Builds the system prompt section. |
| `rules.ts` | The tool lists. Enforcement and the prompt both read them, so they cannot drift. |
| `*.test.ts` | Tests. |

To let the agent use another tool, add its name to the right group in `rules.ts`, and to `--tools` in
`scripts/launch.sh`. Anything not listed is refused.

## Development

Run from this folder inside the container:

```bash
npm install          # first time only
npm run typecheck
npm test             # runs every *.test.ts with Node's built-in test runner
```

The tests use temporary folders and a fake pi object, so they need no model and no network. What they cannot cover
is pi's real behavior. Check these in a live session:

- `ctx.model.provider` holds the provider id used in the policy.
- The `input` handler's `handled` result really withholds the message.
- `--no-approve` ignores a `.pi/extensions` folder placed inside the workspace.
- A message shown by `/prompt` matches what the model receives.
