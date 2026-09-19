# Stage 3: the 89 survivors as paragraphs, rescored

Each paragraph states the idea, the mechanism, the build cost in hours for a small team,
and what it earns from the four judging criteria. P2 is the probability after expansion.
Several ideas moved once the mechanism was written down, in both directions.

**Cut line: keep P2 >= 23%. 26 survive.**

## A. Framing

**A1 Glass box, no claim without a card.** Every sentence in the report is a Claim object
carrying artifact ids and a confidence; the renderer raises an exception on a claim with an
empty citation list. Cost 3h. It converts "we avoid hallucination" from a promise into a
structural property, which is exactly what criterion 3 rewards. **P2 21**

**A3 Triage: vitals before diagnosis.** Data quality is not a stage that runs alongside the
fault logic, it is a gate in front of it: compute a trust score, and if it fails, the diagnosis
code path never executes and the system says which check blocked it. Cost 2h on top of checks
already required. This is criterion 2 turned into control flow. **P2 24**

**A7 The airlock.** Exactly one module may cross the boundary to a model, every model client
lives behind it, and its signature accepts only derived artifact types. Cost 2h if chosen at
hour zero. It satisfies the gate, and it makes the byte counter, the egress log and the
blocked-send demo nearly free. **P2 23**

**A9 One Signal type for every domain.** The core operates on Signal(timestamps, values,
meta), so a sensor column, an invoice amount stream and an hourly error count are literally
the same object. Free at hour zero, expensive to retrofit at hour thirty. It makes criterion 4
structural rather than aspirational. **P2 23**

**A10 Decipherment framing.** Present the run as deciphering an undocumented language and
publish a Rosetta table of column to meaning with evidence per row. Free, it is packaging.
It gives the sensor report a shape an audience remembers, but it carries no mechanism of its
own, which caps it. **P2 19**

**A13 Reconstructed flowsheet.** From the lagged correlation graph, prune to significant
edges, orient by lag sign, cluster into unit operations, render with graphviz next to the real
TEP diagram. Cost 4 to 6h with real risk of a hairball. When it works it is the single most
memorable artifact available in this challenge. **P2 24**

**A19 No-egress by default.** The shipped configuration uses a local model and cloud is the
opt-in that requires a written justification per call. Cost is a config decision. It inverts
the usual demo and reads as conviction rather than compliance. **P2 21**

**A28 Minutes of early warning.** Define one business number: the gap between the sample where
we flag and the first sample where a conventional range alarm would fire, measured across all
faulty runs. Cost 1h once detection exists. It gives the pitch a spine number and it maps
directly to money in the operator's language. **P2 22**

## B. Sensor understanding

**B1 Measured versus manipulated without reading names.** Actuator signals are bounded,
quantized, move in staircases, saturate at limits, and lead their neighbours; measurements are
noisy and lag. Score each column on those five features and report the split with evidence.
Cost 3h. The brief explicitly asks for this structural first pass. **P2 22**

**B6 Lagged cross-correlation graph.** For all 1,326 pairs take the maximum absolute
correlation over lags 0 to k, keep what survives a permutation threshold, and orient each edge
by the sign of the lag at the maximum. Cost 2h on a 52 column table. It is the substrate for
the flowsheet, the neighbour rule and the causal walk. **P2 22**

**B8 Control loop discovery.** Find pairs where an actuator moves shortly after a measurement
deviates, with a consistent negative sign, and name them loops. Cost 2h. Control engineers in
the room will recognise it instantly, which buys credibility cheaply. **P2 20**

**B20 The fingerprint vector is the artifact.** About twenty numbers per sensor: mean, coefficient
of variation, autocorrelation time, spectral slope, quantization step count, bounded support,
saturation fraction, stationarity, response lag to its top neighbours. Cost 3h. This vector is
simultaneously the evidence base for every inference and the only thing a model ever sees, so
one mechanism serves both criterion 1 and the gate. **P2 24**

**B22 Every inference carries its falsifier.** The schema forces each claim to name the
statistic that would overturn it, for example "if the quantization step count were above 200,
this would not be a valve". Cost 1h of schema and prompt work. It is the cheapest way to show
the separation between inferred, assumed and uncertain. **P2 21**

**B23 The blind test.** Hash the column names before the pipeline ever sees them, run the whole
understanding stage on anonymous columns, then reveal the true names and score the report.
Cost 1h. It kills the obvious objection that this dataset labels its own answer, it proves
autonomy in one slide, and it is the strongest opening available. **P2 27**

**B29 Orientation gives a flowsheet order.** Lag signs give a directed graph, a topological
sort of it reads as upstream to downstream order, and that ordering is what makes the later
causal walk legitimate rather than decorative. Cost is included in B6. **P2 21**

**B35 One evidence card per sensor.** Five lines: inferred role, confidence, the three
statistics behind it, the falsifier, and the neighbours it moves with. Cost 2h. It is
deliverable one in their list, and it is the unit an operator can argue with. **P2 21**

## C. Data quality

**C2 Frozen versus legitimately constant.** A level under tight control still jitters at its
instrument noise floor, so compare the window's noise power against the sensor's own calibrated
band rather than against zero. Cost 1h. It is the detail that separates a team who thought
about instruments from a team who called pandas.describe. **P2 21**

**C6 One sensor moved or the plant moved.** Use the correlation neighbourhood: if a signal
deviates while its coupled neighbours hold steady, the instrument is the suspect. Cost 1h given
the graph. **P2 21**

**C7 The neighbour rule as the headline.** Promote C6 to the sentence the whole data quality
story is told with, since it is physically obvious, instantly understandable and it is the
mechanism behind their own "a dead sensor is not a process fault" slide. **P2 23**

**C11 A trust score per batch.** Aggregate the four baseline checks plus instrument-level flags
into one number with a breakdown. Cost 2h. It gives the operator a single thing to look at and
gives the gate something to test. **P2 21**

**C12 Refusal is a feature.** Below threshold the system states which check failed, names the
sensors involved, and declines to produce a diagnosis. Cost is trivial once the gate exists.
The pitch template asks what the system refuses to do, and most teams will have no answer. **P2 23**

**C13 and C14 The virtual sensor.** Regress each sensor on its top neighbours over fault-free
data; afterwards, a persistent residual bias on one sensor while its neighbours stay consistent
is calibration drift, a residual that moves coherently across a cluster is a process fault.
Cost 3 to 4h. One mechanism delivers data quality, drift detection and attribution at once,
which is the best hours-to-criteria ratio in the whole list. **P2 25**

**C20 Kill a sensor live.** During the demo, freeze a column in the incoming stream and let the
system call it a data fault, name the sensor, and refuse to diagnose a process fault. Cost 1h
of demo plumbing. It is the single clearest proof of criterion 2 that can be shown in twenty
seconds. **P2 24**

**C21 Show the naive detector being fooled.** Run a plain threshold or plain autoencoder
detector on the same frozen sensor and show it reporting a process fault, side by side. Cost
1h. Judges cannot grade a subtlety they have not seen violated. **P2 23**

**C22 Three buckets, always.** Every flag is classified as broken data, broken process, or a
changed operating point, and the bucket is part of the log schema. Cost 1h. It structures the
entire output and it transfers unchanged to business data. **P2 22**

**C23 Suppress the operating point change.** Detect a setpoint move or grade change and
suppress the fault alarm it would otherwise cause. Cost 3h, and the fault-free TEP runs have
little of it, so the evidence has to come from the business domain. **P2 19**

## D. Rules

**D1 A small check language, not generated code.** The model emits a constrained structure
(quantity, comparator, threshold, window, persistence) that deterministic code executes. Cost
3h. It is the difference between an auditable check and an unauditable snippet. **P2 21**

**D2 Approve the translation, not just the result.** Show the operator's sentence and the
compiled check side by side and require approval of the translation itself. Cost 1h. It is a
human-in-the-loop moment that is about the system's reasoning rather than its output. **P2 22**

**D3 Every rule ships with a test.** After compiling, run the check across fault-free history
and report where it fires, so the operator sees "this rule would have fired on 0.3% of normal
operation" before accepting it. Cost 2h. Nobody else will do this and it is obviously right. **P2 22**

**D16 The same sentence compiles in both domains.** Demonstrate the compiler on a sensor rule
and on an invoice rule with the same code path. Cost 1h given the adapter. It is the cheapest
evidence for criterion 4. **P2 20**

**D17 The model proposes, the code executes.** No model output is ever executed or trusted as a
number; it only ever selects among grounded quantities and comparators. Cost is architectural
discipline. It makes every hallucination auditable and bounded, which is the honest answer to
"what happens when the model is wrong". **P2 23**

## E. Drift

**E1 PCA with T-squared, Q, and contribution plots.** The textbook method for exactly this
dataset, built on the 500 fault-free runs, with every alarm decomposed into per-sensor
contributions. Cost 3h. Attribution matters more than accuracy here, and this method is
attributable by construction. **P2 23**

**E5 Watch the correlation structure, not just the levels.** A broken loop changes
relationships before it changes means, so track the residuals of learned pairwise relations.
Cost 2h given the virtual sensor. **P2 21**

**E6 Detect it N samples before the alarm would.** Frame every detection result as a lead time
against a conventional range alarm on the same data. Cost 1h. **P2 22**

**E19 Quote a real false alarm rate.** Calibrate detector thresholds on held-out fault-free
runs and state the resulting false alarms per day out loud in the pitch. Cost 2h. Honesty about
a weak number scores better here than silence about a strong one. **P2 21**

**E22 One timeline, two moments.** Plot the sample where we flagged and the sample where the
threshold alarm fired on the same axis, with the drift trace behind them. Cost 1h. It is the
chart that proves the headline number. **P2 22**

## F. Diagnosis

**F1 Rank by contribution, not by importance.** Sensor ranking comes from the decomposition of
the detector statistic itself, so the ranking is a derivation rather than an opinion. Cost is
included in E1. **P2 22**

**F2 Walk upstream to the earliest deviating ancestor.** Given the oriented graph, start at the
flagged sensor and walk against the edges until no upstream neighbour deviates earlier; that
node is the candidate root. Cost 3h. It turns a ranked list into an actual root cause claim,
which is deliverable four. **P2 23**

**F3 Earliest mover, not loudest mover.** Rank candidates by time of first deviation rather
than by magnitude, because the loudest signal is usually downstream of the cause. Cost 1h. It
is a one-line insight that reads as domain competence. **P2 22**

**F4 A narrative chain, not a list.** Emit the diagnosis as an ordered chain, this actuator
saturated, so this level rose, so this temperature fell, each link citing its evidence. Cost 2h.
It is exactly the step-by-step explanation for a non-specialist that they asked for. **P2 23**

**F5 Test the cause by what else it should have moved.** For each candidate, derive its expected
downstream consequences from the graph and check whether they occurred, then report the hit
rate. Cost 3h. It is hypothesis testing rather than pattern matching. **P2 21**

**F6 Show the ruled-out list.** Publish the candidates that were considered and rejected with
the evidence that rejected them. Cost 1h. Cheap, and it is the difference between a conclusion
and a derivation. **P2 20**

**F19 Symptom is not cause, and say so.** When the evidence supports only a symptom, the system
names the symptom, states what it would need to identify the cause, and stops. Cost 1h. **P2 20**

## G. Human in the loop

**G2 Accept, question, override on every output.** Three actions, each writing a log entry with
actor, timestamp, reason. Cost 3h with a thin UI. It is deliverable five, and without it the
criterion is unmet no matter how good the analytics are. **P2 21**

**G3 Questions are answered from artifacts only.** The why dialogue retrieves the artifacts
behind the claim and answers over them, never over raw rows, so the sovereignty gate holds
inside the conversation too. Cost 2h. **P2 21**

**G4 Overrides stick.** An override is persisted and applied on the next run, so the operator
sees their correction respected rather than re-argued. Cost 2h. Most teams will log the
override and then ignore it; applying it is the differentiator. **P2 22**

**G5 A repeated override becomes a proposed rule.** After the same correction twice, the system
drafts a rule change and offers it for approval, closing the loop from human judgment back into
automation. Cost 2h. **P2 21**

**G25 Show the payload before it is sent.** A preview of the exact text destined for an external
model, with an approve or edit step. Cost 2h. It makes the boundary tangible to a human rather
than only to a test. **P2 22**

## H. Log

**H11 The egress log.** A separate, append-only record of every external call: destination,
jurisdiction, model, byte count, artifact ids, justification. Cost 2h. It is the evidence for
the gate criterion and it generates the data flow record they ask for as deliverable eight. **P2 23**

## I. Sovereignty

**I1 The boundary is a type.** Raw frames live in a type that has no serializer to the model
client, and the client accepts only Artifact subclasses, so an accidental raw send is a type
error rather than a policy violation. Cost 2h. It is the strongest possible answer to the gate
and it is the kind of sentence engineers repeat afterwards. **P2 24**

**I2 The egress proxy scans anyway.** Belt and braces: before any call, scan the payload for
row-shaped content and for values that match raw records, and refuse on a hit. Cost 2h. **P2 21**

**I3 Trigger the refusal on stage.** Run a command that deliberately attempts to send raw rows
and show it blocked, logged and counted. Cost 1h. Twenty seconds of demo that no competitor
will have, and it is the gate criterion proved rather than asserted. **P2 25**

**I4 The byte counter.** A live tally of everything that crossed the boundary during the run,
in kilobytes, displayed next to the dataset size in megabytes. Cost 1h. **P2 23**

**I5 The data flow diagram is generated.** Render deliverable eight from the egress log rather
than drawing it, so the diagram cannot drift from reality. Cost 2h. **P2 20**

**I6 Three model backends behind one interface.** Local open weights, an EU-hosted endpoint, and
a frontier model, selected by configuration, with the jurisdiction recorded per call. Cost 3h.
It is a stated core requirement, so it is necessary, but every serious team will do it. **P2 21**

**I7 Run the whole thing on a local model once, on stage.** Cost 2h plus model download risk,
and it needs testing early. It converts the bonus capability into a demo beat. **P2 22**

**I15 Everything is complete with zero cloud calls.** The report, the log and the case file are
all produced locally; the model only ever adds narration. Cost is architectural. **P2 20**

**I17 The model narrates, it does not compute.** Every number comes from deterministic code and
the model only phrases it. Cost is discipline. It simultaneously satisfies the gate, bounds
hallucination and makes the pipeline fast. **P2 23**

**I26 A test that fails if a raw row could leave.** A unit test that monkeypatches the client and
asserts no raw frame can reach it, run in CI and shown on stage. Cost 1h. Policy as a test is
more convincing than policy as a paragraph. **P2 22**

**I27 The minimization ratio.** State it as a number: 24 MB of sensor data in, roughly 9 kB of
derived summaries out, a ratio of about 2,700 to 1. Cost 1h. It makes data minimization
measurable instead of rhetorical. **P2 23**

**I30 Pull the network cable.** Run the final beat with networking disabled on the laptop. Cost
0h, it is a choice. It is theatre, but it is theatre that is also proof. **P2 22**

## J. Adaptability

**J1 One adapter interface.** Any tabular source becomes timestamped signals through a small
adapter with a schema mapping. Cost 3h at hour zero. **P2 21**

**J2 Run the second domain live.** A messy business dataset, invoices or orders, processed by
the same binary with a different config, producing the same four artifacts. Cost 4 to 5h
including finding or generating the data. It is the difference between claiming criterion 4 and
demonstrating it. **P2 23**

**J3 Show the diff.** Prove the core was untouched by showing that the second domain added only
an adapter and a config file, as a git diff on screen. Cost 0h, it is a consequence of doing J1
properly. **P2 22**

**J16 Sensor identity becomes column semantics.** The same inference code that says "this is a
valve position" says "this is a currency amount" on business data, from the same fingerprint
vector. Cost 2h. It shows the abstraction is real rather than nominal. **P2 21**

## K. Demo

**K1 Open with the blind test.** First forty seconds: here are twenty anonymous columns, here is
what the system said each one was, here is the truth, here is the score. Cost 0h beyond B23.
It earns attention before any architecture is mentioned. **P2 24**

**K3 Four beats matching four criteria.** Structure the demo in their order so the scoring sheet
fills itself in. Cost 0h. **P2 21**

**K4 Close on the egress receipt.** Last twenty seconds: what left, to whom, how many bytes, and
the refusal that was logged. Cost 0h beyond the log. **P2 22**

**K5 Sabotage a sensor live.** See C20. As a demo beat rather than a capability, it is the
moment the data quality criterion is won. **P2 23**

**K6 The flowsheet is the hero image.** One picture, the inferred plant graph, beside the real
one. Cost 0h beyond A13, though it depends on A13 not producing a hairball. **P2 21**

**K7 Side by side with a naive detector.** See C21, staged as a split screen. **P2 22**

**K9 Let a mentor pick the fault.** Offer the faulty runs and let a mentor choose which to
inject, which removes any suspicion of staging. Cost 0h, risk moderate, and it requires the
system to be genuinely robust across fault types. **P2 21**

**K10 Let a mentor override.** Hand the keyboard over for one override and let them watch the
log entry appear and the next run respect it. Cost 0h given G4. **P2 20**

**K11 Wifi off for the finale.** The last run happens with networking disabled, on local
weights. **P2 22**

**K15 Refusal as a feature, said out loud.** Name the three things the system will not do, in
one slide, in their own vocabulary. Cost 0h. **P2 21**

## L. Trust and evaluation

**L3 Report the accuracy including the misses.** State performance on the labeled faults,
including where the system failed and why. Cost 1h. Their criteria explicitly prefer a
well-reasoned uncertain answer to a confident unsupported one. **P2 20**

**L6 Every claim cites an artifact, enforced.** A validator rejects a report containing a claim
with no citation. Cost 2h. **P2 22**

**L7 Block numbers that are not in the artifacts.** Parse numerals out of model output and
verify each one appears in the cited artifacts, refusing to print those that do not. Cost 3h.
It is a measurable anti-hallucination control, and it is rare enough to be remembered. **P2 23**

**L12 Silence is a result.** Run on fault-free data and show that nothing fires. Cost 1h. **P2 21**

**L13 Cross-check narration against the numbers.** Compare the model's prose against the
deterministic values and flag contradictions before display. Cost 2h. **P2 21**

**L16 Traceability coverage percentage.** Report what fraction of claims in the final report are
traceable to an artifact id, and target 100%. Cost 1h. **P2 21**

**L19 Make hallucination measurable on stage.** Show the count of blocked or uncited claims for
the run, so the control is visible rather than described. Cost 1h. **P2 20**

## M. Execution discipline

**M3 Keep the model out of the hot loop.** Deterministic analytics compute, the model narrates
at three fixed points. Cost is discipline, it buys speed, testability and the gate. **P2 22**

**M10 The last six hours belong to the pitch.** Feature freeze Saturday night, Sunday morning is
rehearsal, fallback recording and the handout. **P2 20**

**M11 Write the pitch skeleton first and build only what fills it.** Cost 1h on Friday, saves
ten on Saturday. **P2 21**

**M12 Four finished artifacts beat eight half-finished ones.** They list eight deliverables;
a complete four with visible evidence will outscore eight stubs. **P2 20**

**M14 Get the faulty datasets tonight.** Only fault-free training is on disk, and every fault
demo, every drift claim and every diagnosis depends on the faulty files. This is the single
largest execution risk in the build. **P2 24**

## N. Wildcards

**N5 Let a judge type a rule at the table.** Hand them the keyboard, let them write an operating
limit in English, and run it. Cost 0h beyond the compiler, high reward, moderate risk. **P2 21**

**N20 The fabricated sensor test.** Feed the system a column of noise labelled as a sensor and
report honestly whether it invented a role. Cost 1h. It is an integrity demonstration, but it
competes for time with beats that prove required criteria. **P2 19**

## The 26 survivors at P2 >= 23

A3, A7, A9, A13
B20, B23
C7, C12, C13+C14, C20, C21
D17
E1
F2, F4
H11
I1, I3, I4, I17, I27
J2
K1, K5
L7
M14
