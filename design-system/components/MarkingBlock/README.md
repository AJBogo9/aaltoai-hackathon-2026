# MarkingBlock

A small hairline grid of document control fields, borrowed from an engineering drawing's title block.

Two to four rows of label and value: project, classification, sheet, revision. It gives a
cover image or a document first page somewhere to carry its marking without a full band, and
it reads as bookkeeping rather than branding, which is the argument.

**The consumer provides** the rows. Classification is a level and takes `text-*`; everything
else is `ink-900`.

Rules:

- `rule-200` hairlines on every cell edge, `radius-flat`, labels in the `label` style and
  values in `value`.
- Bottom right of a cover or first page, never centred.
- At most four rows. It is a block, not a table of contents.
