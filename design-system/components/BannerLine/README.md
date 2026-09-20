# BannerLine

The classification band that runs full bleed across the top and bottom of every slide, and across the top of the cover image.

The level word sits left in `band-ink` on the level's `band-*` fill. It is the signature of
this system: the page is marked by the product it describes.

On the cover image and the site the providers cleared at that level sit right. **On a slide
they do not:** a provider list on all twelve bands repeated itself into clutter, so the deck
carries the level alone and names the cleared providers on the routing slide instead.

**The consumer provides** the level and the cleared provider list, read from
`.pi/confidentiality.json` rather than typed. When that file changes, every band changes.

Rules:

- Full bleed. The band starts at x=0 and spans the full width, through the `space-5` gutter.
- Uppercase, `0.18em` letterspacing, the `banner` type style.
- Top and bottom of a slide carry the same level. Where a right hand side is used at all,
  the bottom one may replace the provider list with a fixed line such as
  `PAGE MARKED BY CONFIDENTIALITY-BROKER`.
- The level must be true of that page. A band that overstates is a lie told in the room; a
  band that understates undercuts the demo.
