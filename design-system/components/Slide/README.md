# Slide

The full 16:9 slide layout: band, eyebrow, headline, sub, body, kick, band.

Every slide in the deck is this skeleton with one of two bodies: `FieldColumns` for a
comparison, or `MachineBlock` for evidence. Keeping to two bodies is what makes nine slides
read as one document.

**The consumer provides** the level (which sets both bands), the eyebrow, one headline
claim, a sub line, the body, and the kick line.

Rules:

- 1280x720 reference, `space-5` gutter, bands full bleed.
- One claim per headline, in sentence case. If two claims fit, split the slide.
- The kick line is the consequence, not a summary of the headline.
- `radius-flat` and no shadows anywhere inside the slide.
