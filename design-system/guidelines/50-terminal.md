# The terminal

The deck quotes the terminal, so the terminal is the original and everything else is the
copy. If the two disagree, the terminal is right and the slide is wrong.

That cuts the other way too: for the first day the product printed `confidential` in
yellow while every band, chip and slide printed it in blue. The deck was quoting
something that had never appeared on screen.

## The palette

Three colours, from the dark theme text tokens, because a terminal is dark:

| Paint | Token | Carries |
| --- | --- | --- |
| `allow` | `signal-allow`, an alias of `text-public` | the lowest level, `✓`, a cleared provider |
| `between` | `text-confidential` | every level between the lowest and the highest |
| `refuse` | `signal-refuse`, an alias of `text-restricted` | the highest level, `✗`, `⛔`, an unknown label |
| `dim` | ink | separators, hints, anything that is not a level |

`brand.generated.ts` and `tokens.sh` hold those values, both written by
`scripts/brand.py`. Nothing types an escape sequence next to a hex value again.

A level's paint is decided by its position in the ladder, not by its name, so a policy
with five levels still gets green at the bottom, red at the top and blue in between.

## Degrading

- 24 bit when `COLORTERM` is `truecolor` or `24bit`. That is the only mode that prints the
  design system's actual colours.
- Otherwise the 4 bit approximation: 32, 94, 31. Bright blue, not yellow, so the ladder
  still reads the same way.
- `NO_COLOR` set, or output that is not a terminal: no escapes at all, and every word
  survives. A band piped into a file is still a band, in text.

## The two marked frames

1. **The launcher band**, printed by `scripts/launch.sh` before pi takes the screen: the
   level on the left, the providers cleared for it on the right, white on the level's
   fill, full width. It is the same component as the band on a slide, and it is the first
   thing a room sees.
2. **The footer status line**, printed by the broker for the whole session: workspace and
   label, provider and clearance, the verdict, the session level. It is the one element
   that proves the rest, so a slide pastes it rather than redrawing it.

## Glyphs

`✗` refused, `✓` allowed, `●` the session led, `○` no workspace, `⛔` messages withheld.
They are the product's own, set at text size. Do not substitute an icon font, and do not
add a lock or a shield: the argument is that this is bookkeeping, not security theatre.

## Presenting

Terminal font size matters more than anything else on screen. Set it large enough to read
from the back row before you walk up, and check `COLORTERM` on the machine you present
from, because a 4 bit fallback on a projector is the one place the blue can read as grey.
