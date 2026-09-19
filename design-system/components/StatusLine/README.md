# StatusLine

The product's footer status line, reproduced exactly: workspace and its label, provider and its clearance, the verdict, the session level.

It sits under the prompt for the whole session and changes as the state changes, which is
the claim the pitch makes about being able to tell. On a slide it is the one element that
proves the rest, so it is never redrawn from memory.

**The consumer provides** the four states. The led is `signal-refuse` when there is no
access and `signal-allow` when there is.

Rules:

- `status` type style, mono, `ink-600` for the labels and `ink-900` for the values.
- Keep the square brackets and the lowercase level names. They are what the product prints.
- Terminal font size during a live demo matters more than anything else on screen. Set it
  large enough to read from the back row before you walk up.
