# The challenge

> **Draft, written from the partner PDF on Sat 19 Sep.** Sections marked
> **CONFIRM** are decisions the team has to make together, not things the brief
> settles. Correct them before anyone writes code.

## Partner

Norrin. Full brief in
[`Norrin_Hackathon_Challenge_Sep_2026.pdf`](Norrin_Hackathon_Challenge_Sep_2026.pdf)
and the deck [`Norrin_AaltoAI_Challenge_Sep2026.pptx`](Norrin_AaltoAI_Challenge_Sep2026.pptx).

## The brief, in their words

Title: **Trustworthy process monitor**

> Build an autonomous agent that automates the full data-reliability pipeline: it
> ingests a real, undocumented industrial sensor dataset, infers what the data
> represents, detects data quality issues and early signs of process drift, and
> diagnoses the root cause of any fault while keeping a human operator able to
> review, question, and override every conclusion, and without the raw data ever
> leaving the operator's environment. The same underlying approach should
> generalize beyond sensor data to other messy, high-volume data domains, such as
> manually entered business records.

Two constraints they repeat in different words throughout, which look like the
real grading axis:

> data minimization by design: the LLM reasons over derived artifacts,
> statistical fingerprints, correlation summaries, rule text — never raw sensor
> rows

> make the LLM layer swappable: the pipeline must run against a locally hosted or
> EU-hosted model through configuration, not a rewrite

And on what counts as a good inference:

> a lower-confidence inference with visible reasoning should count as stronger
> than a confident-sounding label with none

### Expected output, verbatim list

1. **Sensor understanding report**: inferred identity/role for each unlabeled sensor, with the statistical or relational evidence behind each inference and a stated confidence level.
2. **Automated data quality checks**: baseline checks on completeness, validity, consistency, timeliness, plus executable checks derived from plain-language rules, each with pass/fail status and traceability.
3. **Drift and anomaly detection**: continuous monitoring output, flagged where drift becomes significant, referencing the specific signal(s) responsible.
4. **Root-cause diagnosis**: fault type, ranked contributing sensors, step-by-step explanation suitable for an operator with no data science background.
5. **Human-in-the-loop controls**: a clear path to review, accept, question, or override any system output.
6. **Decision log**: every inference, flag and diagnosis, with supporting evidence, plus any human review or override.
7. **Adaptability demonstration**: evidence the same logic applies beyond the sensor dataset, as a second-domain run or a reasoned architectural walkthrough.
8. **Data-flow record**: what leaves the operator's environment, to which model, and why, plus evidence the model layer can be swapped.

### Bonus

- A third data domain, further from sensors (free text, logs).
- A **"no-egress mode"**: the full pipeline end to end on a locally hosted open-weight model.
- Confidence or uncertainty scores throughout, not only at the final diagnosis.

## The brief, in ours

**CONFIRM with the team.** Proposed:

We build a monitor that is handed an unlabeled industrial sensor feed and works
out, on its own, what the sensors are, whether the data can be trusted at all,
and whether the process is drifting toward a fault. Every conclusion arrives with
the evidence that produced it and a confidence level, and an operator can
override any of it. The raw data never leaves the operator's machine: the model
sees only derived statistics, correlation summaries and rule text, and every call
to it is logged with what was sent and why.

## Who owns the data, and what are they allowed to do with it?

- **Testbed dataset**: Tennessee Eastman Process, already in
  [`data/`](../data/) and explored in
  [`notebooks/01-eda-tennessee-eastman.ipynb`](../notebooks/01-eda-tennessee-eastman.ipynb).
  Simulation output, so no data subjects and no personal data.
- **Consequence**: the sovereignty argument here is **not** GDPR. It is trade
  secret and operational confidentiality. A plant's sensor traces reveal
  throughput, recipe and efficiency, which is exactly what an operator will not
  post to a US inference API. Frame the pitch that way rather than reaching for
  Article numbers that do not apply.
- **CONFIRM with a mentor**: does Norrin want the GDPR framing anyway, for the
  "manually entered business records" generalization where personal data *would*
  be in scope?

## Constraints

- **Data that must not leave a boundary:** raw sensor rows. Never sent to any
  model, local or remote. Only derived artifacts cross that line: statistical
  profiles, correlation matrices, plain-language rule text. This is requirement
  11 and it is testable, so make it visibly true in code, not just claimed.
- **Regulatory hooks:** GDPR does not bite on simulated process data. EU AI Act
  tier is **an open question** for a monitoring system in an industrial setting.
  **Ask a mentor** rather than asserting a tier in the pitch.
- **Tech they expect or provide:** Norrin supplies an OpenAI-compatible endpoint
  serving Mistral Large 3, hosted in Finland. See
  [`cloud-setup.md`](cloud-setup.md) for the URL, model id and how to call it.
- **Compute and third-party credits available:** $286.50 of Verda credit in the
  shared `aaltoai-hackathon` project. All Verda regions are in Finland. This is
  what makes the no-egress bonus reachable: run an open-weight model on our own
  GPU instance and point the same pipeline at it by config.

## What does done look like?

**CONFIRM with the team.** About 14 hours left at the time of writing, three
people. The eight expected outputs will not all be built well. Proposed demo
sequence, in the order it would be shown:

1. Point the tool at `data/te_process.csv` with no labels and no prompt written
   by us. It emits the **sensor understanding report**: per-sensor role guess,
   the correlation or lag that justifies it, a confidence level. (Output 1)
2. Run the **data quality pass** on a batch, showing a broken-sensor case flagged
   separately from a broken-process case. (Output 2)
3. Feed a faulty run. Watch **drift detection** fire, pointing at named sensors
   rather than an aggregate score. (Output 3)
4. Show the **root-cause diagnosis** in plain language, with ranked contributing
   sensors and a confidence level. (Output 4)
5. **Override** one conclusion in the UI and show the **decision log** recording
   the override alongside the original evidence. (Outputs 5 and 6)
6. Show the **data-flow record**: exactly what went to the model, and flip the
   config from the Norrin endpoint to our own Verda-hosted open-weight model
   without changing code. (Output 8 plus the no-egress bonus)
7. **Adaptability** (Output 7): an architectural walkthrough is explicitly
   allowed and is far cheaper than a second-domain run. Take the cheap option
   unless time appears from nowhere.

Deliberately out of scope unless everything above is finished early: the third
data domain, a real second-domain pass, uncertainty scores on every intermediate
step.

## Questions for the mentors

- [ ] Is the GDPR framing wanted at all, given the testbed has no personal data?
- [ ] Which EU AI Act risk tier does Norrin consider this system to sit in?
- [ ] Does the architectural walkthrough genuinely satisfy output 7, or do they
      want to see a second dataset actually run?
- [ ] For the no-egress bonus, does a small open-weight model on our own GPU
      count, or do they expect comparable quality to Mistral Large 3?
- [ ] Is "the LLM never sees raw rows" checked by inspection of our code, or do
      they want a runtime guard that makes it impossible?

## Mentor answers

<!-- Timestamp these. Mentors contradict each other; the later answer wins. -->
