# Documents the system writes

A slide marked `RESTRICTED` while the report it summarises carries no marking at all is
the weaker half of the claim. The audit output is the product's other half, and it is what
a reviewer actually reads, so it carries its marking the same way.

## The marking line

Above the title, not in a footer, and not inside the prose:

```markdown
`RESTRICTED` · cleared: lemonade, ollama

# Plant audit
```

- The level is read from the workspace's own `.confidentiality.json`. Nothing else may
  decide it, and no default is applied.
- The cleared providers are every provider in the policy whose clearance is that level or
  higher, lowest clearance first. Same order as a band, because it is the same fact.
- **An unlabelled folder gets no marking.** `sensordata/` in the repository root carries
  no label, so a report generated there opens with its title and says nothing about
  clearance. A marking invented for an unlabelled folder is a lie about the one mechanism
  this project is selling.

## Machine readable output

A JSON report carries the same fact as its first key, so a reader sees what the file is
before its contents:

```json
{"marking":{"cleared":["lemonade","ollama"],"level":"restricted"},
"schema":[
```

`audit` ignores keys it does not know, so adding it costs nothing downstream.

## Every page we author

The repository is public, so a page in it reads `PUBLIC` and lists all six providers, even
where the page discusses a confidential workspace. `scripts/brand.py` owns that line in
the root README, the broker README, `demo/README.md`, this design system's README, the
decision log, the cloud setup and the pull request template.

`docs/challenge.md` is the sponsor's brief, quoted rather than written here, and is left
exactly as it arrived. Do not mark a document you did not write.

## How generated prose reads

The same rules as any other surface, and they belong in the skill prompt rather than in a
review comment, because the agent writes most of this text:

- No em dashes or en dashes. Commas, colons, parentheses, or two sentences.
- Lowercase for machine words (`tag_19`, `restricted`, `unit_06.csv`), sentence case for
  prose. A level is a value in a file and stays as the file spells it.
- Quote the number that convinced you rather than describing it. "median 0.42 -> 0.71 at
  block 6, no partner moved" is evidence; "a significant shift" is not.
- State what is not known. 27 tags left `indeterminate` is a result, not a gap.
