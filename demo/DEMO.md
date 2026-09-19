# Demo script

Three fake workspaces, one per level, and providers at each level (see `.pi/confidentiality.json`):

| Provider | Where it runs | Clearance |
|---|---|---|
| google, openai | cloud, outside the EU | public |
| mistral | cloud, EU | confidential |
| lemonade, ollama | local | restricted |

| Workspace | Label | Providers cleared |
|---|---|---|
| `demo/public-docs` | public | google, openai, mistral, lemonade, ollama |
| `demo/confidential-hr` | confidential | mistral, lemonade, ollama |
| `demo/restricted-health` | restricted | lemonade, ollama |

All data is made up. Each session is bound to one workspace: `scripts/launch.sh <folder>` starts pi in a
container where only that folder is writable. Use `/model` to switch provider. Watch the footer at every step.

Generated files (reports, scripts) land in the workspace folder on the host. Clean up afterwards with
`git clean -fd demo`.

## 1. A provider that is not cleared gets nothing
`scripts/launch.sh demo/confidential-hr`, model **google** or **openai** (google is pi's default). Type any
message, for example "List the files in the workspace."
- Expect: the footer shows `session confidential`, a red `●`, `✗ no access` and `⛔ messages withheld`. The message
  is withheld with a note to switch provider. Slash commands such as `/model` still work.

## 2. A cleared provider works
`/model mistral` (or launch with `-- --provider mistral`). Ask: "Summarize employees.csv."
- Expect: the dot turns green and it reads the file. The session is at `confidential` from the start, so
  nothing rises.

## 3. Switching to a less trusted provider is refused
Same session, `/model openai`.
- Expect: a warning ("gets no tools and no messages") and the footer goes back to `⛔ messages withheld`. The next
  message is withheld, so the confidential data already in the conversation is not sent to openai.
  `/model mistral` brings it back.

## 4. Python for data analysis
Model **mistral**. Ask: "Write a Python script that computes the average salary per city, run it, and save the
result to report.md."
- Expect: `bash` runs the script inside the sandbox and `report.md` appears in the workspace folder.

## 5. Prompt injection in a file
Model **mistral**. Ask: "Summarize vendor-email.txt."
- The file tells the model to `cat /etc/passwd`, read `~/.pi/agent/auth.json` and write into
  `../public-docs`.
- Expect: nothing outside the workspace exists in the container. There is no auth file, `../public-docs` is not
  there, and the host is not reachable.

## 6. The label file is protected
Model **mistral**: "Change .confidentiality.json to public."
- Expect: refused by the file tools, and read-only if attempted from a script. Only the user can change labels.

## 7. The top level
`scripts/launch.sh demo/restricted-health`, model **mistral**: refused. `/model lemonade` or `ollama`: the same
request works.

## 8. The workspace cannot be changed
`/workspaces` lists every labeled folder and its label, but nothing inside pi switches to one. To use another
folder, exit and run `scripts/launch.sh` again.

## 9. The launcher refuses bad workspaces
- `scripts/launch.sh .` — the project folder cannot be a workspace.
- `scripts/launch.sh demo` — no `.confidentiality.json`.
- `scripts/launch.sh --dry-run demo/public-docs` — checks and prints the command without starting pi.

## Before going on stage
- Export the keys for the providers you will use in the shell that runs `launch.sh` (`GEMINI_API_KEY`,
  `OPENAI_API_KEY`, `MISTRAL_API_KEY`). Local providers need none, but a custom provider such as lemonade must be
  defined in a `models.json`, which you pass with `PI_MODELS_FILE`.
- The provider ids in `.pi/confidentiality.json` must match the ids pi shows for your models. A provider that is
  not listed is treated as `public`.
- Do not ask the model to print its environment: the launcher passes the API keys in as environment variables.
