# AaltoAI Hackathon 2026 — Data Sovereignty & Responsible AI

> **Submission deadline: Sunday 20 September, 11:00.**
> Submit at [aaltoai.com](https://aaltoai.com): create an account, go to Dashboard, enroll in the
> Data Sovereignty & Responsible AI Hackathon with the event code, fill the form.
> Presentations run 11:00–14:00, **10 minutes per team** including mentor questions.

## Challenge

Not picked yet. Paste the partner brief into [`docs/challenge.md`](docs/challenge.md) the moment you have it.

## Team

| Name | GitHub | Focus |
| --- | --- | --- |
| Andreas Bogossian | @AJBogo9 | |

## Quickstart

The project stack gets added in one commit once the team picks the challenge. What exists now is the guarded
agent: [pi](https://pi.dev) running on one labeled folder, in a container where only that folder is writable.

```bash
scripts/launch.sh demo/confidential-hr -- --provider mistral
```

Needs docker or podman, and the API keys of the providers you want set in your shell. The demo workspaces,
providers and a scripted walkthrough are in [`demo/DEMO.md`](demo/DEMO.md). How the guard works is in
[`.pi/extensions/workspace-guard/README.md`](.pi/extensions/workspace-guard/README.md).

## How we work

- Small commits straight to `main`. Branch only when two people are rewriting the same file.
- `git pull --rebase` before you push.
- Any decision that cost more than five minutes of discussion goes in
  [`docs/decisions.md`](docs/decisions.md), one line, with the time.
- Keep [`docs/pitch.md`](docs/pitch.md) alive while you build. Sunday morning is too late to start it.

## Data handling

This is a data sovereignty hackathon, so the repo treats sponsor data as radioactive:

- **Everything in `data/` is gitignored.** Partner datasets, exports and scratch files go there.
- **Give the agent one labeled folder at a time.** Put a `.confidentiality.json` in it and start pi with
  `scripts/launch.sh`. Providers cleared below the label get no access.
- **Secrets live in a local environment file that git ignores.** Create it when the sponsors
  hand out credentials at the event, and never commit it.
- Assume this repo may be made public before judging. Nothing committed here should be
  anything you would not hand to a stranger.

## Event logistics

- Design Factory, Puumiehenkuja 5, Espoo. Luma registration needed at check-in.
- Venue is open overnight; sleeping at the venue is not allowed.
- Partners bringing challenges: Microsoft, Norrin, Relex, IBM, Elisa.
