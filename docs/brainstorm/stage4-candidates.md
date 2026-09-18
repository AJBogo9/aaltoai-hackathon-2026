# Stage 4: eight candidate systems, three paragraphs each

The 26 surviving paragraphs are not eight separate products. Most are beats, and a beat cannot
be pitched on its own. So they are composed here into eight candidate systems, each defined by
its **spine**: the one thing the build goes deep on, the pitch is organised around, and the
other three criteria hang off. Every candidate still covers all four criteria plus the gate,
because the brief requires it. The spine decides where the 26 working hours go.

Assumption for scoring: 1 to 3 people, roughly 26 working hours from Friday evening to Sunday
09:00, plus the faulty datasets arriving tonight.

**Cut line: keep P3 >= 28%. Three survive.**

---

## S1. Hidden Names (spine: understanding)

Everything is built around the blind protocol. Column names are hashed before the pipeline sees
anything, so the system works from numbers alone. Each of the 52 columns gets a fingerprint
vector of about twenty statistics, the pairwise lagged correlation graph is built and oriented,
the structural pass separates actuators from measurements on quantization, bounded support and
lead time, and the model is asked to name clusters and roles while seeing only fingerprints and
correlation summaries. The output is a sensor report with an evidence card per column, a
falsifier per claim, and a reconstructed flowsheet drawn from the oriented graph. At the end,
the names are revealed and the report is scored against them.

Build: Friday night convert the data and compute fingerprints; Saturday morning the graph and
the structural split; Saturday afternoon the model layer over fingerprints, evidence cards and
the flowsheet render; Saturday evening drift and diagnosis as thin layers on the same graph;
Sunday morning the blind grading and rehearsal. The hard risk is the flowsheet turning into a
hairball, which is mitigated by pruning to the top three edges per node and by having the
evidence cards stand alone if the picture fails.

Pitch and judging: it opens with the strongest forty seconds available in this challenge, the
blind reveal, and it owns criterion 1 outright, because a system that never saw a label cannot
have been hand-tuned to one. It also disarms the one objection this dataset invites, that the
column names give away the measured versus manipulated split. Its weakness is that data quality,
human-in-the-loop and adaptability are all supporting beats rather than deep work, and criterion
2 is where most teams will be weakest, so a rival who goes deep there can out-score it on a
criterion this candidate only satisfies competently. **P3 29**

---

## S2. A Dead Sensor Is Not A Process Fault (spine: data quality)

The spine is one mechanism with an unusually good ratio of hours to criteria: the virtual
sensor. Every signal is regressed on its strongest correlated neighbours over fault-free data.
Afterwards, three residual patterns mean three different things. A persistent bias on one signal
while its neighbours stay consistent is instrument drift. A collapse of the noise floor is a
frozen sensor, even when the value looks plausible. A residual that moves coherently across a
whole cluster is the process itself. That single engine produces the data quality verdict, the
drift signal and the attribution ranking, and it feeds a hard triage gate: the trust score is
computed first, and when it fails, the diagnosis stage never runs and the system names the check
that blocked it.

Build: Friday night fingerprints and the neighbour graph; Saturday morning the regression bank
and the three residual tests; Saturday afternoon the trust gate, the three-bucket classifier and
the PCA contributions for ranking; Saturday evening the operator surface with accept, question
and override, plus the sabotage harness that freezes a column in the replay stream; Sunday the
naive-detector comparison and rehearsal. Nothing here needs a model to work, which is why it is
also the lowest-risk build on the list.

Pitch and judging: the demo moment is a live sensor kill, twenty seconds, with a naive detector
on the other half of the screen calling it a process fault while ours calls it a dead
instrument and refuses to diagnose. That is Norrin's own slide, played back at them, and
criterion 2 is the criterion most teams will blur because it is unglamorous. It pairs naturally
with human-in-the-loop, since refusal, override and appeal are the same surface. Its weakness is
the opening: without the blind reveal it starts on a technicality rather than on wonder, so it
should borrow the blind test as beat one even if the understanding stack is thinner. **P3 31**

---

## S3. Nothing Leaves (spine: sovereignty)

The spine is the boundary. Raw frames live in a type with no serializer to any model client,
the client accepts only Artifact subclasses, and one airlock module is the only code in the repo
that may cross. Behind it sit three interchangeable backends, local open weights, an EU-hosted
endpoint and a frontier model, chosen by configuration, with jurisdiction recorded per call. An
egress ledger records destination, model, byte count, artifact ids and a written justification
for every crossing, the data flow diagram required as deliverable eight is rendered from that
ledger rather than drawn, and a byte counter reports the minimization ratio: tens of megabytes
of sensor data in, single-digit kilobytes of derived summaries out.

Build: Friday night the type split and the airlock; Saturday morning the ledger, the counter and
the policy test that fails if a raw frame can reach a client; Saturday afternoon the analytics
that produce the artifacts, kept deliberately conventional; Saturday evening the local model
path and a cached-response fallback; Sunday the blocked-send demo and the offline run. The risk
is inverted from the others: the sovereignty machinery is cheap and certain, while the analytics
it protects must still be good enough to be worth protecting.

Pitch and judging: it is the only candidate that matches the name of the hackathon itself, and
it contains two demo beats no competitor is likely to have, a deliberate raw send refused and
logged on stage, and a final run with the network disabled. But Norrin's own scoring calls data
control a gate, not a criterion, and a gate is passed, not won. Spending the spine on a
pass/fail item risks arriving at the four scored criteria with a competent rather than a
distinctive answer. The right move is to keep every mechanism in this candidate and demote it
from spine to closing beat. **P3 26**

---

## S4. No Claim Without A Card (spine: traceability)

The spine is a Claim object. Nothing reaches the operator as free text: every sentence carries
artifact ids, a confidence and a falsifier, and the renderer raises rather than print a claim
with an empty citation list. A validator parses every numeral out of model output and verifies
it appears in the cited artifacts, refusing to print the ones that do not, and the run reports a
traceability coverage percentage plus a count of blocked claims. Overrides are first class and
symmetric with machine decisions in the log, they persist and apply on the next run, and a
correction repeated twice is drafted into a proposed rule.

Build: Friday night the claim schema and the log; Saturday morning the analytics that fill it;
Saturday afternoon the citation and numeral validators plus the operator surface; Saturday
evening the override persistence and the rule proposal; Sunday the coverage report. The cost is
spread thin across the whole system rather than concentrated, which makes it the hardest
candidate to abandon halfway.

Pitch and judging: it targets criterion 3, where their wording is unusually explicit, that a
correct-sounding conclusion with no shown derivation scores lower than a well-reasoned uncertain
one. Showing a blocked hallucination on stage, with a number, is a genuinely rare thing to be
able to do. The weakness is that traceability is infrastructure, and infrastructure demos
poorly: the audience sees a report and has to be told what would have happened without the
machinery. It is a superb property of a winning system and a weak spine for a five minute
pitch. **P3 26**

---

## S5. One Core, Two Domains (spine: adaptability)

The spine is the abstraction. A Signal is a timestamped numeric series with metadata, adapters
turn any tabular source into signals, and the entire core, fingerprints, graph, checks, drift,
diagnosis, log, is written against that type with no dataset-specific constant anywhere. The
second domain is a messy business table, invoices or purchase orders, with duplicated records,
typo'd categories and impossible dates. The same binary runs it with a different config and
produces the same four artifacts, and the same plain-language rule compiler compiles an operating
limit for a reactor and a business rule for an invoice through the same code path.

Build: this is the only candidate that must be decided at hour zero, because the abstraction
cannot be retrofitted on Sunday morning. Friday night defines the Signal type and both adapters,
and the business dataset is found or generated before anything else is built. Saturday builds
the core once and runs it twice. The cost is four to five extra hours and a permanent tax on
every design decision, paid in exchange for a criterion that most teams will satisfy with an
architecture slide.

Pitch and judging: criterion 4 is explicitly listed, and the brief offers an easy escape, a
reasoned architectural walkthrough, which most teams will take. Running it live is strictly
stronger, and showing that the second domain added only an adapter and a config file, as a diff
on screen, is close to unarguable. The weakness is that a spreadsheet of invoices is the least
visually compelling thing that can appear in a process-monitoring pitch, and it competes for the
same minutes as the sensor story it is supposed to generalise. Keep the mechanism, spend ninety
seconds on it, do not build the pitch on it. **P3 27**

---

## S6. The Causal Chain (spine: diagnosis)

The spine is the walk. The oriented lagged-correlation graph gives an upstream to downstream
ordering, and when a deviation is flagged, the system walks against the edges to the earliest
deviating ancestor, ranks candidates by time of first deviation rather than by magnitude, and
emits an ordered narrative: this actuator saturated, so this level rose, so this temperature
fell, each link citing the specific signal, time and value that supports it. Each candidate
cause is then tested by deriving what else it should have moved and checking whether it did, and
the candidates that failed that test are published as a ruled-out list.

Build: Saturday morning the graph, Saturday afternoon the walk and the consequence test,
Saturday evening the narrative rendering and the fault library matching. The risk is that the
graph on this dataset is dense, since a chemical plant under closed-loop control couples almost
everything to everything, so the walk can produce a chain that is technically supported and
physically wrong. Mitigation is partial correlation, pruning to the strongest few edges per
node, and an explicit confidence drop when two chains fit equally well.

Pitch and judging: it is the most intellectually impressive candidate and it delivers
deliverable four in its strongest form, a step-by-step explanation an operator with no data
science background can follow. It is also the thing most teams will attempt, which means it is
where the field is densest and where being merely good is invisible. And a wrong chain, stated
fluently, is the exact failure mode the judges say they will punish. **P3 26**

---

## S7. The Rule Compiler (spine: rules)

The spine is plain English becoming an executable check. The model emits a constrained structure,
quantity, comparator, threshold, window and persistence, never code, and deterministic code
executes it. The operator sees their sentence beside the compiled check and approves the
translation itself, not just its verdict. Every compiled rule is immediately backtested against
fault-free history, so the operator is told "this rule would have fired on 0.3% of normal
operation" before accepting it, and a rule that cannot be grounded in an inferred sensor is
refused with a clarifying question rather than guessed.

Build: Saturday afternoon, roughly six hours including the backtest and the registry. It depends
on the sensor understanding stage existing first, because rules must bind to inferred roles
rather than to column names if they are to survive a schema change or a domain change.

Pitch and judging: the live moment is excellent, a judge types an operating limit at the table
and watches it compile, backtest and run, and the same sentence compiles against business data
to prove the rule layer is domain agnostic. But it is one of eight deliverables, and a spine
must carry a criterion, not a bullet. As a two-minute segment inside another pitch it is
outstanding, and as the organising idea of the whole submission it is too narrow. **P3 23**

---

## S8. The Early Warning Clock (spine: one number)

The spine is a number: minutes of early warning. For every faulty run, the system records the
sample at which it flagged and the sample at which a conventional range alarm would have fired,
and reports the distribution of the gap across all fault types, alongside an honest false alarm
rate calibrated on held-out fault-free runs. The whole pitch is built around that single pair of
numbers, and every other capability is presented as what makes it trustworthy: the data quality
gate exists so the early warning is not a dead sensor, the evidence trail exists so the operator
can act on it, the boundary exists so the plant can run it at all.

Build: it needs the faulty datasets, a calibrated detector, and a careful definition of the
baseline alarm, roughly six hours on top of the detection work everyone does anyway. The risk is
that the number comes out unimpressive or, worse, impressive for the wrong reason, because a
detector tuned for lead time buys it with false alarms, and quoting one without the other is the
sort of thing a mentor who works on process data will catch in the question round.

Pitch and judging: a single quantified business claim is the most persuasive rhetorical device
available, and it translates the work into the operator's economics rather than the data
scientist's. But none of the four criteria is "detects earlier", and the criteria that do exist
reward derivation, separation, human control and portability. This is the best closing slide on
the list and a risky spine. **P3 24**

---

## Cut

**Survivors at P3 >= 28: S2 (31), S1 (29). Marginal: S5 (27), promoted to third finalist.**

S5 is promoted over S3, S4 and S6 at 26 because it is the only candidate whose decision cannot
be deferred: adapters and the Signal type must be chosen at hour zero or criterion 4 becomes an
architecture slide. The other three lose their spine role but keep every mechanism as a beat
inside the finalists, which is how the final pitches use them.

### What the losing spines taught

- A gate is passed, not won. S3 proves the hackathon's own theme but spends the spine on a
  pass/fail item, so it becomes the closing beat of every finalist instead.
- Infrastructure that prevents a failure demos poorly unless the failure is shown happening to
  someone else. S4 survives only as the blocked-hallucination counter and the side-by-side.
- Density of field matters as much as quality. S6 is where every team will go, so brilliance
  there is invisible while competence in data quality is rare.
- A spine must carry a criterion, not a deliverable (S7) and not a metric (S8).
