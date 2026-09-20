<!-- brand:marking -->
`PUBLIC` · cleared: google, openai, mistral, verda, lemonade, ollama
<!-- /brand:marking -->

# Marked Document

The visual system for **confidentiality-broker**: label based access control for LLM agents, built for
the Norrin challenge at AaltoAI 2026.

One rule holds the whole system together:

> **The artifact is marked by the system it describes.**

A slide is not a picture of access control. It is a page that carries a classification band
stating the level of what is on it and which providers are cleared to see it. A reader who
understands the band has already understood the product. Everything else here serves that
band: paper ground, hairline rules, one colour per level, and machine output quoted rather
than redrawn.

This system was chosen over five alternatives (a terminal look, a control room panel, a
Swiss statute look, an engineering drawing sheet, and a redaction look) on a weighted
rubric. It won on concept fit and on how much of it survives GitHub, and it kept winning
with build cost removed from the score.

## Content fundamentals

- **Quote the machine, never paraphrase it.** A refusal on a slide is the string the broker
  printed, including the glyph and the lowercase level names. If it is not what the software
  says, it does not go on a slide.
- **Name the check that refused.** "Refused" alone is a claim. "refused: provider google is
  cleared public, workspace is confidential" is evidence.
- **Lowercase for machine words, sentence case for human ones.** `public`, `confidential`,
  `restricted`, `google`, `ollama` are values in a config file and stay lowercase in mono.
  Headlines are sentence case prose in serif. Only the band and labels are uppercase.
- **One claim per headline.** The sub line qualifies it, the kick line at the foot states
  the consequence. If a slide needs a second claim, it needs a second slide.
- **No em dashes or en dashes.** Commas, colons, parentheses, or a restructured sentence.
- **State limits in the same voice as claims.** "It is a guardrail, not a sandbox" belongs
  on a slide, not in a footnote.

## The marking rule

The band is a claim you make out loud, so it has to be true of the page it sits on:

<!-- brand:marking-table -->
| The page shows | Band | Fill token |
| --- | --- | --- |
| Nothing confidential (a mechanism diagram, the roadmap, the title) | `PUBLIC` and the six cleared providers | `band-public` |
| A confidential path, filename or field name | `CONFIDENTIAL` and the four cleared providers | `band-confidential` |
| Anything from the health workspace | `RESTRICTED` and the two cleared providers | `band-restricted` |
<!-- /brand:marking-table -->

The right hand side of the band lists the providers cleared at that level, read from
`.pi/confidentiality.json`. When the file changes, the bands change. A band that does not
match its page is worse than no band, because the deck is the demo.

## Visual foundations

- **Paper first.** `paper-000` is the ground everywhere, including the slides. The product
  runs in a dark terminal, so the deck stays light: the live demo then reads as a different
  surface rather than more of the same.
- **Rules, not boxes.** Separation comes from `rule-200` hairlines. No card borders, no
  fills behind text, no shadows inside a slide. `shadow-web` exists only for showing a
  slide thumbnail on a web page.
- **Three colours and nothing else.** The level colours are the palette. A band fill
  (`band-*`) carries white text; the same level set as text on paper uses `text-*`, which
  is lighter in the dark theme because the fill would fail as text. There is no fourth
  accent, no brand hue, no chart palette. If something needs colour and is not a level, it
  stays ink.
- **Square.** `radius-flat` on everything in the deck. The rounded tokens exist for GitHub
  and web surfaces only.

## Typography

Three faces, one job each:

| Face | Carries | Why |
| --- | --- | --- |
| PT Serif | Headlines, sub lines, kick lines, document prose | Institutional rather than startup. A claim in serif reads as written down, not pitched. |
| PT Mono | Anything the machine said: paths, levels, JSON, terminal output, the status line, the repo name | The reader can tell quoted material from our prose without a caption. |
| PT Sans | The band, and UI chrome around a slide | Neutral, and it disappears. |

All three are installed on the presenting machine **and** served by Google Fonts, so the
deck, the cover images and any web page agree. This was not true of the first deck, which
asked for Cambria, Arial and Courier New: none of them are installed, so LibreOffice
substituted Caladea, Liberation Sans and Cousine at export time without saying so. Check
with `fc-list : family | grep -ix "PT Serif"` before presenting on a new machine, and
present from the PDF, which embeds them.

Type sizes are px at a **1280x720** reference. Multiply by 0.75 to get points for
python-pptx (1280px at 96dpi is 13.333in, which is the 16:9 slide width).

## Iconography

There is no icon set, on purpose. The only glyphs in the system are the ones the product
prints: `✗` for a refusal, `✓` for an allow, `●` for the session led. They are set in PT
Mono at text size and coloured `signal-refuse` or `signal-allow`. Do not substitute an icon
font, and do not add a lock, a shield or a key: the argument is that this is bookkeeping,
not security theatre.

## Where each surface is written down

| Guideline | Surface |
| --- | --- |
| [`20-deck.md`](guidelines/20-deck.md) | The nine slides, built with python-pptx |
| [`30-github-cover.md`](guidelines/30-github-cover.md) | The banner, the badges, the marking line |
| [`40-web.md`](guidelines/40-web.md) | The Pages site and the component previews |
| [`50-terminal.md`](guidelines/50-terminal.md) | The launcher band and the footer status line |
| [`60-generated-documents.md`](guidelines/60-generated-documents.md) | The audit reports, and every page we author |

## One generator, or it drifts

`tokens.json` and `.pi/confidentiality.json` own the facts. **`scripts/brand.py` turns them
into every surface that states one**, and `python3 scripts/brand.py --check` fails when a
committed surface disagrees:

| It writes | For |
| --- | --- |
| `tokens.css`, `tokens.py`, `tokens.sh` | web, python, bash |
| `brand.generated.ts` | the broker's terminal palette |
| `marked.mplstyle` | matplotlib, on the same foundations |
| `docs/cover-light.svg`, `docs/cover-dark.svg`, `site/social-card.png`, `site/favicon.svg` | the repository's first frame |
| the marking line and badges in the READMEs, the workspace table in `demo/DEMO.md` | every page we author |

This is not tidiness. The banner said `CLEARED: GOOGLE, OPENAI, MISTRAL, LEMONADE, OLLAMA`
and `4 of 5` for a day after `verda` was added, because five surfaces each held their own
copy of a list that lives in one file. A band that does not match its page is worse than no
band, and the same is true of a cover.

## Using a token

- Ground and text: `paper-000` with `ink-900`; a sub line in `ink-600`; a label or eyebrow
  in `ink-400`, uppercase, letterspaced.
- A level word in prose: `text-confidential` on paper, never `band-confidential`.
- A band: `band-confidential` fill with `band-ink` text, full bleed through `space-5`.
- A refusal: `signal-refuse` on `paper-100` inside a machine block, in the `machine` style.
- Space: `space-5` is the slide gutter, `space-6` the column gap, `space-4` the headline to
  sub step. Nothing is spaced by eye.
