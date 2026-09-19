# BannerLine

The classification band that runs full bleed across the top and bottom of every slide, and across the top of the cover image.

The level word sits left, the providers cleared at that level sit right, both in `band-ink`
on the level's `band-*` fill. It is the signature of this system: the page is marked by the
product it describes.

**The consumer provides** the level and the cleared provider list, read from
`.pi/confidentiality.json` rather than typed. When that file changes, every band changes.

Rules:

- Full bleed. The band starts at x=0 and spans the full width, through the `space-5` gutter.
- Uppercase, `0.18em` letterspacing, the `banner` type style.
- Top and bottom of a slide carry the same level. The bottom one may replace the provider
  list with a fixed line such as `PAGE MARKED BY CONFIDENTIALITY-BROKER`.
- The level must be true of that page. A band that overstates is a lie told in the room; a
  band that understates undercuts the demo.
