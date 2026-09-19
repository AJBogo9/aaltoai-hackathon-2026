# The GitHub cover

GitHub markdown allows no CSS. The identity therefore lives in exactly three places, and
everything else is plain markdown.

## 1. One banner image

A 1280x300 SVG with its text flattened to outlines, so it needs no font at render time (see
[CoverBanner](../components/CoverBanner/README.md)). It holds the marking band across the
top, the repository name in `cover-name` (PT Mono), one sentence in `cover-tag`, and the
clearance ladder on the right.

Ship both themes and let the reader's GitHub theme pick:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/cover-dark.svg">
  <img src="docs/cover-light.svg" width="100%"
       alt="confidentiality-broker: the folder carries a label, the provider carries a clearance.">
</picture>
```

The alt text is not decoration. It is the one sentence a screen reader gets, so it states
the mechanism.

## 2. Badges on the level colours

Three badges, in the level colours, carrying facts rather than shields:

```markdown
![tests](https://img.shields.io/badge/tests-117%20passing-00703C)
![levels](https://img.shields.io/badge/levels-3-0B3D91)
![models](https://img.shields.io/badge/models-local%20or%20EU-3C4048)
```

Hex values without the `#`, taken from `band-public`, `band-confidential` and ink. No fourth
colour, and no badge that says nothing (`made with love`, `PRs welcome`).

## 3. A fenced block of the real config

The first code the reader sees is the actual policy file, not pseudocode:

```json
{
  "levels": ["public", "confidential", "restricted"],
  "providers": { "google": "public", "ollama": "restricted" }
}
```

## The marking line

A README can carry the marking in text, as the first line under the banner:

```markdown
`PUBLIC` · cleared: google, openai, mistral, lemonade, ollama
```

Keep it accurate. A public repository page is public, so the line reads `PUBLIC` even
though the deck's slides vary.
