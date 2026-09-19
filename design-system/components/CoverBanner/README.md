# CoverBanner

The 1280x300 repository banner: marking band, repository name in mono, one sentence in serif, and the clearance ladder.

GitHub allows no CSS, so this image is most of what the cover page can carry. Ship a light
and a dark SVG behind a `<picture>` element, at `docs/cover-light.svg` and
`docs/cover-dark.svg`.

**Text must be converted to outlines.** An SVG referenced by `<img>` cannot load a font, so
`font-family="PT Mono"` falls back to whatever the reader happens to have and the typography
collapses. Author it with real text, then flatten:

```bash
inkscape raw-light.svg --export-type=svg --export-text-to-path \
  --export-plain-svg --export-filename=cover-light.svg
```

Check afterwards that the file has no `<text>` element left, then load it through an `<img>`
tag in a browser and look at it. That is the only rendering path that proves it.

**The consumer provides** the name, one sentence, the level for the band, and the provider
counts for the ladder. A public repository page reads `PUBLIC`.

Rules:

- The name in `cover-name` (PT Mono, because it is an identifier a reader will type).
- One sentence in `cover-tag`, stating the mechanism rather than a slogan.
- The band is the same component as on a slide, at cover scale.
- **The clearance ladder** is three bars, one per level, whose length is the number of
  providers cleared to read that level. It is the policy file drawn to scale, so the highest
  label has the shortest bar. Levels run highest at the top.
- The first frame has to stand alone and stay legible when GitHub scales the image down to a
  phone width, so nothing essential goes in text below the `banner` size.
- The image's alt text states the mechanism, since that is what a screen reader receives.
