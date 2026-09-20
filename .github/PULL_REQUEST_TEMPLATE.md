<!-- brand:marking -->
`PUBLIC` · cleared: google, openai, mistral, verda, lemonade, ollama
<!-- /brand:marking -->

## What changed

One claim, then the consequence.

## Checks

- [ ] `python3 scripts/brand.py --check` passes, or I ran `python3 scripts/brand.py` and
      committed what it wrote. Anything that states a level, a provider list, a hex value
      or the test count is generated: change `design-system/tokens.json` or
      `.pi/confidentiality.json`, never the output.
- [ ] `npm test` in `.pi/extensions/confidentiality-broker` passes.
- [ ] Nothing here is partner data. Real data lives in `data/`, which git ignores.
