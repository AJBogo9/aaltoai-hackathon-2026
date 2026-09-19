# LevelChip

A single level set as a small solid chip, for a web surface or a README badge where a full band would be too much.

Use it in prose blocks, tables and cover images. Do not use it on a slide: a slide states its
level in the band, and a second marking on the same page invites the question of which one
is authoritative.

**The consumer provides** the level string. The chip never invents a level: the ladder is
`public`, `confidential`, `restricted`, in that order, from the policy file.

Rules:

- `band-*` fill with `band-ink` text, `radius-chip`, lowercase in mono or uppercase in sans.
  Lowercase mono is preferred, because that is how the value appears in the file.
- Never colour a chip for anything that is not a level.
