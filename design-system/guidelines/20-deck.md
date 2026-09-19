# Building the deck

The deck is nine 16:9 slides, generated with python-pptx and presented from the PDF export.

## Geometry

A slide is 13.333in by 7.5in. Work in the 1280x720 px reference the tokens use and convert
once: **points = px x 0.75**, inches = px / 96.

| Part | Px at 1280 | Points |
| --- | --- | --- |
| Gutter, left and right (`space-5`) | 38 | 28.5 |
| Band height (text 17px plus `space-2` twice) | 41 | 30.75 |
| Headline size (`headline`) | 58 | 43.5 |
| Sub size (`sub`) | 24 | 18 |
| Machine block size (`machine`) | 18 | 13.5 |

The bands run full bleed: they start at x=0 and span the full width, through the gutter.
Everything else stays inside it.

## Order of a slide

1. Top band: level word left, cleared providers right, `band-ink` on the level fill.
2. Eyebrow in `ink-400`, uppercase.
3. Headline, one claim, sentence case, `ink-900`.
4. Sub line in `ink-600`, at most two lines.
5. The body: either two fields (label over a hairline, mono value under it) or one machine
   block quoted from the terminal.
6. Kick line above a `rule-200` hairline, stating the consequence.
7. Bottom band, repeating the level.

## Rules that are easy to break

- **The band tracks the page.** Slide 3 is `public` because nothing confidential is on it.
  Recheck every band whenever a slide's content changes. See the marking rule in the README.
- **Never retype terminal output.** Paste it. The credibility of the whole deck rests on the
  audience believing the block is real.
- **Bash is not in the tool list.** When a slide lists what stopped an injection, the
  wording matches the product's own reason strings.
- **No fourth colour.** A chart, if one is ever needed, uses ink and one level colour.
- **Test the export, not the source.** LibreOffice substitutes a missing face silently, so
  export the PDF and look at it before believing the deck.

## Presenting

Present from `demo/Norrin_Pitch.pdf`. Fonts are embedded there, and a PDF cannot reflow a
line onto two. The stage script lives in `docs/pitch.md` and is the same wording as the
speaker notes.
