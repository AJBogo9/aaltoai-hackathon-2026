# demo workspace

A fake, self-contained workspace for demoing `workspace-guard` together with the
`analyze` / `analyze-fast` skills. Nothing in here is real plant data — the CSVs
are copies of four files from `sensordata/`.

## Label

`.confidentiality.json` labels this folder **`restricted`**, the top level in
`.pi/confidentiality.json`. Against that label:

| provider | clearance | may use this workspace |
|---|---|---|
| `verda` | restricted | ✅ yes |
| `ollama` | restricted | ✅ yes |
| `lemonade` | restricted | ✅ yes |
| `mistral` | confidential | ❌ no |
| `openai` | confidential | ❌ no |
| `google` | public | ❌ no |

So **`verda` is the approved provider** for the demo, and switching to `openai`
or `google` loses file access entirely — which is the point worth showing.

## Run it

From the repo root:

```text
/workspace demo
/confidentiality
/analyze-fast
```

`analyze-fast` resolves its input to `demo/sensordata/` and writes
`demo/reports/`. Use `/analyze` for the slow, accurate pass.
