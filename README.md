<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/cover-dark.svg">
  <img src="docs/cover-light.svg" width="100%"
       alt="confidentiality-broker: a label on the folder, a clearance on the provider, compared on every tool call.">
</picture>

<!-- brand:marking -->
`PUBLIC` · cleared: google, openai, mistral, verda, lemonade, ollama

![tests](https://img.shields.io/badge/tests-114%20passing-00703C)
![levels](https://img.shields.io/badge/levels-3-0B3D91)
![models](https://img.shields.io/badge/models-local%20or%20EU-3C4048)
![AaltoAI 2026](https://img.shields.io/badge/AaltoAI%202026-Norrin-8C8C8C)
<!-- /brand:marking -->

# confidentiality-broker

An AI harness that accounts for data confidentiality, built on the open-source
harness pi. It has two halves.

A pi extension confines the agent to one labelled folder and refuses any provider
whose declared clearance sits below that folder's label. The comparison runs in
code on every tool call, message and compaction, never in the prompt. The
extension is a guardrail; the container is the boundary. `scripts/launch.sh
<folder>` starts pi in a container where that one folder is the only writable
thing: the repo is not mounted, the root filesystem is read-only, every capability
is dropped, and the folder's label file is mounted read-only over it so the agent
cannot relabel its own workspace. Before that container starts, a second throwaway
container with no network validates the label using the same code the extension
runs, so the launcher and the gate can never disagree about what a level means.
The container is also what makes a shell available at all: the broker refuses
`bash` outright unless it is running inside the launcher's container, because a
command cannot be confined by checking a path.

The second half is the audit, in `.pi/skills/`. `analyze` profiles a folder of
undocumented process data in one script run and reasons over the statistics it
prints, never over the rows, so derived statistics are all that reaches the
model: the brief's data minimisation met by construction. It never names what a
sensor measures, because unlabelled numbers do not carry that; real tag names
come only from a person, through a notes file. Every report opens with the
workspace's label and the providers cleared for it, so it still says what it is
when read elsewhere. Alongside it a demo path trades accuracy for seconds, by
fixed thresholds instead of reasoning, and says outright that most of its labels
are wrong. It carries no facts of its own: each finding's evidence is quoted
verbatim, and the numbers behind any call can be printed on demand.


## How it works

Every provider carries a clearance, and every data folder, a workspace, carries a label.

The provider policy is stored in **`.pi/confidentiality.json`**

```json
{
  "levels": ["public", "confidential", "restricted"],
  "providers": {
    "google": "public",       "openai": "public",
    "mistral": "confidential", "verda": "confidential",
    "lemonade": "restricted",  "ollama": "restricted"
  }
}
```

The label for each workspace is stored in **`<workspace>/.confidentiality.json`**

```json
{ "level": "confidential" }
```

As an example, `openai` is cleared `public`, the folder is `confidential`, so the harness prevents messages and tool calls.

```text
Workspace: /workspace
Workspace level: confidential.
Provider openai is cleared for public: every tool will be refused. Switch to a provider cleared for confidential.
Session level: confidential.
```


## Tutorial

**Dependencies.** [pi](https://pi.dev), docker or podman, and the API key of each cloud provider
you want, exported in your shell. Local providers need no key. The tests additionally need Node
22.18 or newer, because they are TypeScript and rely on Node's type stripping; we ran them on
24.18.

**Build.** Nothing to build by hand: `scripts/launch.sh` builds the container image the first time
it runs. After a change to `.devcontainer/Dockerfile`, pass `--rebuild`.

**Workspace.** One labelled folder per session, chosen at launch and fixed for the session:

```bash
scripts/launch.sh demo/confidential-hr
```

`/workspaces` lists every labelled folder and its label. To use another one, exit and launch again.

**Model.** `/model <provider>` switches provider mid-session, or launch with `-- --provider
mistral`.

**Providers.** `/providers` lists every provider, its clearance, and whether it may use this
workspace. Clearances live in `.pi/confidentiality.json`, and a provider that is not listed there
is treated as the lowest level.

**Confidentiality.** `/confidentiality` shows the workspace label, the current provider's
clearance and the session level. The footer shows the same state at all times.

**Skills.** `analyze` audits a folder of undocumented process data, `analyze-fast` does the same by
fixed rules for demo timing, and `audit` reads the resulting reports back out. Ask for them in
plain language rather than as slash commands: they are mounted outside the workspace, so the broker
refuses the model's own read of the skill file.

## Team

Andreas Bogossian, Matias Häkkinen and Tomi Hirviniemi.
