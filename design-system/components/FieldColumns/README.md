# FieldColumns

Two fields side by side, each a letterspaced label over a hairline with a quoted mono value under it.

This is how the mechanism slide shows a comparison: what the folder says on the left, what
the provider is cleared for on the right. The reader does the comparison, which is more
convincing than an arrow claiming the result.

**The consumer provides** two or three label and value pairs. Values are quoted from files,
so paths keep their slashes and JSON keeps its braces and quotes.

Rules:

- `label` style in `ink-400` over a `rule-200` hairline, `value` style under it.
- `space-6` between columns, two columns preferred and three at most.
- The level inside a value takes `text-*`, so the eye lands on the two words being compared.
- No arrows, no equals signs, no icons between the columns. The kick line states the result.
