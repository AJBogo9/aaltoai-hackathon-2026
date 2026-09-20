<!-- brand:marking -->
`PUBLIC` · cleared: google, openai, mistral, verda, lemonade, ollama
<!-- /brand:marking -->

# demo workspaces

Four self-contained workspaces for demoing `confidentiality-broker` together with the
`analyze` / `analyze-fast` / `audit` skills. Every byte in here is invented.
Nothing is partner data.

`demo/` itself carries no label, because it is a folder of workspaces rather than a
workspace. Each folder below is labelled on its own and is launched on its own.

| Workspace | Label | Holds |
|---|---|---|
| [`public-docs/`](public-docs/) | `public` | a product FAQ |
| [`confidential-hr/`](confidential-hr/) | `confidential` | employees.csv, review notes, and a vendor email carrying a prompt injection |
| [`restricted-health/`](restricted-health/) | `restricted` | patients.csv |
| [`restricted-plant/`](restricted-plant/) | `restricted` | 18 sensor recordings and the fast-pass reports built from them |

## Who is cleared for what

From [`.pi/confidentiality.json`](../.pi/confidentiality.json). A provider that is not
listed there is treated as `public`.

| Provider | Where it runs | Clearance | public | confidential | restricted |
|---|---|---|---|---|---|
| `google`, `openai` | cloud, outside the EU | `public` | yes | no | no |
| `mistral`, `verda` | cloud, in the EU | `confidential` | yes | yes | no |
| `lemonade`, `ollama` | on your machine | `restricted` | yes | yes | yes |

So only a local model may touch the two `restricted` workspaces. `verda` is the Finnish
endpoint Norrin provided; it is still a remote service, so it sits with `mistral` rather
than with the local models.

## Run one

From the repo root, one workspace per session:

```bash
scripts/launch.sh demo/confidential-hr          # add --dry-run to check without starting pi
scripts/launch.sh demo/restricted-plant
scripts/launch.sh --offline demo/restricted-health   # same, with no network at all
```

The workspace is fixed when pi launches and cannot be changed during a session. There is
no command that switches it: `/workspaces` lists the labelled folders, and to use another
one you exit and run `scripts/launch.sh` again.

Inside pi:

```text
/confidentiality     the workspace label, your provider's clearance, the session level
/providers           every provider and whether it may use this workspace
/analyze-fast        the fast, low-accuracy pass
/analyze             the slow, accurate pass
```

`analyze-fast` resolves its input inside the workspace, so on `demo/restricted-plant` it
reads `sensordata/` and writes `reports/`, both relative to that folder. The reports
committed there are exactly what it produces.

[`DEMO.md`](DEMO.md) is the full step-by-step script.
