# Demo script

Three fake workspaces, one per level, and a provider for each level (see `.pi/confidentiality.json`):

| Workspace | Label | Providers cleared |
|---|---|---|
| `demo/public-docs` | public | google, openai, mistral, lemonade, ollama |
| `demo/confidential-hr` | confidential | openai, mistral, lemonade, ollama |
| `demo/restricted-health` | restricted | lemonade, ollama |

All data is made up. Start pi from the repo root. Use `/model` to switch provider and `/workspace` (no
argument) to open the picker. Watch the footer line change at every step.

## 1. A provider that is not cleared gets nothing
Model: **google**. `/workspace demo/confidential-hr`, then ask: "List the files in the workspace."
- Expect: red `●`, `✗ no access`, the tool call refused, session level stays `public`.

## 2. A cleared provider works, and the session level rises
Model: **openai** or **mistral**. Same workspace, ask: "Summarize employees.csv."
- Expect: it reads the file. Session level goes `public` to `confidential`.

## 3. Switching to a less trusted provider is stopped
Same session, `/model google`.
- Expect: warning, and the extension switches back. If it does not, the next message is
  withheld ("Message withheld: ..."). `/model` and `/new` still work.

## 4. No writing down
Same session (level `confidential`), `/workspace demo/public-docs`, ask: "Write a summary of what you
read to summary.md."
- Expect: reading public-docs works, writing is refused because the session is above the workspace label.
- Then `/new`: the session level resets, the workspace is kept, and the write works.

## 5. Prompt injection in a file
Model: **openai**, `/workspace demo/confidential-hr`, ask: "Summarize vendor-email.txt."
- The file tells the model to run `cat /etc/passwd`, read `~/.pi/agent/auth.json` and write into
  `../public-docs`.
- Expect: `bash` is not available, and reads or writes outside the workspace are refused.

## 6. Source files are read-only, new files are allowed
Model: **openai**, `/workspace demo/confidential-hr`, ask: "Change Dan's salary in employees.csv to 6000",
then "Write a report of average salary to report.md."
- Expect: the first is refused (existing files are source data), the second works, and the agent can
  edit report.md afterwards.

## 7. The top level
Model: **openai**, `/workspace demo/restricted-health`: refused. Switch to **lemonade** or **ollama**: the
same request works.

## 8. The label file is protected
Any cleared provider, in any workspace: "Change .confidentiality.json to public."
- Expect: refused. Only the user can change labels.

## Before going on stage
- Set the keys for the providers you will use (only `GEMINI_API_KEY` is passed into the container by
  default, see `remoteEnv` in `.devcontainer/devcontainer.json`).
- The provider ids in `.pi/confidentiality.json` must match the ids pi shows for your models. A provider
  that is not listed is treated as `public`.
