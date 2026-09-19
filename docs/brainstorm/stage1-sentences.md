# Stage 1: fan-out, unfiltered

355 one-sentence ideas for the Norrin "Trustworthy process monitor" challenge.
No filtering at this stage. Anything remotely adjacent is included on purpose.

## A. Core product framing (what the thing IS)

A1. Build "the glass box": every output is a claim with a linked evidence card, and the UI cannot render a claim that has no card.
A2. Frame the system as a courtroom: hypotheses, evidence, cross-examination by a critic agent, verdict with confidence, operator as judge.
A3. Frame it as medical triage: check the vitals (data quality) before diagnosing the patient (process), and refuse to diagnose a patient whose thermometer is broken.
A4. Ship a "sensor passport" per column: identity, role, confidence, evidence, issued and revoked over time.
A5. Build a compiler: plant English in, executable checks out, with the intermediate representation visible.
A6. Make the product a ledger, not a dashboard: an append-only, hash-chained record of every inference, flag and override.
A7. Position it as an airlock: the plant side holds raw data, the model side sees only derived artifacts, and the airlock logs every passage.
A8. Sell the system as a new hire: day one it reads the plant, week one it writes its own checks, and it always shows its notebook.
A9. Make the core abstraction a "signal" so sensors, invoice fields and log counters are literally the same object to the pipeline.
A10. Treat the unlabeled dataset as a lost language and the system as a decipherment engine that publishes a Rosetta table.
A11. Build a trust budget that depletes: each failed quality check spends trust, and below a threshold the system stops issuing diagnoses.
A12. Ship a monitor that only speaks in falsifiable statements, each carrying the test that would refute it.
A13. Make the hero artifact a reconstructed process flow diagram drawn only from correlation and lag structure.
A14. Build an agent that writes its own data dictionary and then defends it under questioning.
A15. Build the second-opinion product: it never asserts alone, a critic model must sign off or the confidence is capped.
A16. Frame the deliverable as an operator's morning briefing, one page, three sections, no dashboards.
A17. Make it an incident recorder: when something breaks it exports a self-contained case file anyone can replay offline.
A18. Build the pipeline as pure functions over derived artifacts so a whole run is reproducible from a seed.
A19. Sell no-egress as the default and cloud as the opt-in, inverting the usual demo.
A20. Make the product a policy engine where sovereignty rules are declarative and enforced at runtime, not documented in a README.
A21. Frame it as insurance underwriting: the system prices its own confidence and states what it would need to raise it.
A22. Build a "data emergency room" where the sensor stream is the patient and the decision log is the chart.
A23. Focus the entire build on one question: can an operator overturn the machine in three clicks and have it stick?
A24. Make the system's output a pull request against the plant's rulebook, reviewed and merged by a human.
A25. Build a time machine: replay any past window through the current logic and diff the conclusions.
A26. Position the system as a translator between control engineers and data scientists, speaking both languages in one report.
A27. Build a shadow mode that runs beside the existing alarm system and reports what it would have caught, and how much earlier.
A28. Frame everything around "minutes of early warning" as the single business metric.
A29. Build an agent that produces exactly the eight required artifacts and refuses scope creep on stage.
A30. Build the anti-dashboard: the demo is a conversation, the artifacts are files, and no chart appears until the operator asks.

## B. Sensor identity inference

B1. Infer measured versus manipulated variables from quantization and staircase structure rather than from column names.
B2. Use autocorrelation time to separate fast flow measurements from slow temperature and level measurements.
B3. Use the noise floor and spectral slope as an instrument fingerprint, since thermocouples, flowmeters and analyzers differ measurably.
B4. Detect composition analyzers by their long sampling interval and piecewise-constant traces between updates.
B5. Rank candidate physical units by order of magnitude and typical operating band, then state units as a hypothesis with a confidence.
B6. Use lagged cross-correlation to build a directed graph and infer upstream and downstream order.
B7. Cluster sensors by mutual information into unit operations, then name each cluster with a model that sees only cluster statistics.
B8. Find control loops by locating pairs where a manipulated variable moves just after a measured variable deviates.
B9. Search for linear combinations of flows that sum to near zero and label them a mass balance.
B10. Use ratio stability between signals to propose composition fractions that must sum to one hundred.
B11. Identify pressure sensors by their instant, plant-wide response to any upset.
B12. Identify level sensors by integrating behaviour: the signal looks like the running sum of a flow difference.
B13. Identify temperature sensors by first-order exponential responses with long time constants.
B14. Use step-response identification against manipulated variables to fit gains and lags for a small process model.
B15. Use the sign of the steady-state gain to distinguish heating from cooling actuators.
B16. Detect recycle loops as cycles in the lagged correlation graph and call them out explicitly.
B17. Use principal components to find the few degrees of freedom the plant actually has, then describe each component physically.
B18. Fit a sparse Granger-style regression per signal and keep only parents that survive a permutation test.
B19. Use variance ratios across operating windows to rank sensors by informativeness.
B20. Fingerprint each signal with a compact vector of about twenty statistics and let the model reason only over that vector.
B21. Give the model a menu of candidate roles from general process engineering knowledge and force a choice with evidence citations.
B22. Make every inference carry a falsifier: the specific statistic that, if different, would overturn the label.
B23. Grade the system by hiding the true column names and revealing them only after the report is generated.
B24. Cross-validate inferred roles by holding out simulation runs and checking the same role is inferred again.
B25. Use dimensionless statistics, like coefficient of variation, so role inference transfers across datasets with different scales.
B26. Use change-point structure to distinguish setpoint changes from disturbances.
B27. Detect saturation: signals that sit pinned at a bound are actuators running out of room.
B28. Use a distribution bounded on zero to one hundred as strong evidence for a valve position.
B29. Use cross-correlation lag signs to orient every edge and produce a topological sort that reads as a flowsheet.
B30. Estimate the effective sampling rate per signal and flag signals whose bandwidth does not match it.
B31. Detect derived or redundant columns that are exact functions of others and mark them as not independent evidence.
B32. Use periodic components to estimate recycle residence times.
B33. Ask the model to write the data dictionary as competing hypotheses with priors, then update those priors with tests.
B34. Compare each signal against a library of synthetic archetypes (integrator, first-order, dead-time, oscillator) and report the best match.
B35. Publish a per-sensor evidence card that a control engineer could argue with line by line.

## C. Broken data versus broken process

C1. Flag stuck sensors by zero variance over a window short relative to that signal's own autocorrelation time.
C2. Distinguish a plausible constant (a level under tight control) from a frozen reading by checking whether the noise floor vanished.
C3. Detect quantization changes that signal a firmware or calibration change rather than a process shift.
C4. Detect clock problems (duplicate timestamps, gaps, non-monotonic samples) before any statistics run.
C5. Detect unit changes as sudden scale jumps with preserved correlation structure.
C6. Separate single-sensor anomalies from plant-wide anomalies by whether physically coupled neighbours moved too.
C7. Make the central rule: if a signal moves but its coupled neighbours do not, suspect the instrument, not the process.
C8. Detect out-of-range values against bounds learned from fault-free data rather than hardcoded limits.
C9. Treat flatlines exactly at a range limit as saturation, not as a process fault.
C10. Classify missing value patterns as random, bursty or systematic, since each implies a different cause.
C11. Score every batch with a data trust score before any diagnosis is attempted.
C12. Refuse to diagnose when trust is below threshold, and name precisely which check failed.
C13. Detect drift in the sensor itself by comparing it against a reconstruction from its neighbours.
C14. Build a neighbour-based virtual sensor and flag persistent bias against it as calibration drift.
C15. Distinguish a noise increase (failing instrument) from a mean shift (process change).
C16. Detect duplicated blocks of rows, the sensor equivalent of a business record entered twice.
C17. Check that composition fractions sum to their expected total and flag a breach as a consistency failure.
C18. Render the four baseline checks (completeness, validity, consistency, timeliness) as four lights the operator reads in one second.
C19. Make data quality failures block the pipeline visibly rather than degrade it silently.
C20. Inject a dead sensor live on stage and show the system calling it data, not process.
C21. Show a naive anomaly detector diagnosing that dead sensor as a process fault, side by side with ours.
C22. Classify every flag into exactly one of three buckets: broken data, broken process, changed operating point.
C23. Detect operating point changes (grade change, setpoint move) and suppress the false fault alarm they cause.
C24. Learn per-sensor expected noise bands during a calibration window and check against them thereafter.
C25. Detect sensor swaps or rewiring when the correlation structure of two columns suddenly transposes.
C26. Detect rounding or truncation artifacts that reveal a lossy export step upstream in the data pipeline.
C27. Show data quality as a per-sensor health bar sitting next to its identity card.
C28. Escalate repeated data quality failures into a draft maintenance work order.
C29. Treat late-arriving data as a timeliness fault with its own explanation, not as missing data.
C30. Version the checks so a rule change never silently rewrites the history in the log.

## D. Plain-language rules to executable checks

D1. Compile plain-language rules into a small inspectable check language rather than into arbitrary generated code.
D2. Show the compiled check next to the sentence that produced it so the operator approves the translation itself.
D3. Auto-generate a test for every compiled rule using real windows where it should pass and where it should fail.
D4. Refuse to compile a rule whose quantity cannot be grounded in an inferred sensor, and ask a clarifying question instead.
D5. Let the operator write "reactor pressure must not exceed 2900 kPa for more than five minutes" and watch it become a check with a timer.
D6. Support rules that reference inferred roles rather than column names so they survive a schema change.
D7. Keep a rule registry with provenance: who wrote it, when, what it binds to, and its firing history.
D8. Sandbox every generated check so a bad rule cannot crash the monitor.
D9. Let a failing rule propose its own relaxation and require human approval to apply it.
D10. Mine candidate rules from fault-free data and offer them to the operator to accept or reject.
D11. Express compiled rules in a form that reads back as English so review needs no programming.
D12. Attach a severity and a recommended action to every rule so a flag carries a next step.
D13. Version rules alongside the decision log so an old alert can be explained under the rule of its time.
D14. Detect conflicting rules and surface the conflict rather than silently ordering them.
D15. Scope rules to operating modes so startup does not trip steady-state limits.
D16. Compile the same rule text against a business dataset to prove the rule layer is domain agnostic.
D17. Let the model propose the rule but let deterministic code execute it, so even a hallucinated threshold stays auditable.
D18. Show a rule coverage map: which sensors have no rule watching them at all.
D19. Require a logged reason whenever an operator disables a rule.
D20. After a fault, propose the check that would have caught it earlier and offer to add it.

## E. Drift and anomaly detection

E1. Use PCA on fault-free data with T-squared and Q statistics, the textbook baseline, but attribute every alarm to per-sensor contributions.
E2. Use CUSUM on model residuals to catch slow drift that never leaves the normal range.
E3. Use exponentially weighted moving averages per sensor to catch gradual bias.
E4. Use a distributional distance between rolling windows and the fault-free reference.
E5. Detect drift in correlation structure, not just marginals, since a broken loop changes relationships first.
E6. Build the headline claim around detecting a fault N samples before a range alarm would fire.
E7. Use an autoencoder residual only if reconstruction error can be attributed per sensor.
E8. Prefer simple explainable detectors, because the judging rewards traceability over raw accuracy.
E9. Run several detectors and report their agreement as a source of confidence.
E10. Detect drift toward a specific known fault signature rather than drift in general.
E11. Build fault fingerprints from labeled faulty data offline, then match live windows by similarity, keeping labels out of detection.
E12. Draw the drift trace with a widening uncertainty band rather than a single confident line.
E13. Use control chart run rules, which operators already trust, as a bridge to the fancier detectors.
E14. Report time-to-threshold projections so operators can plan instead of panic.
E15. Detect oscillation onset as a failure mode distinct from mean drift.
E16. Detect valve stiction from the shape of the actuator versus measurement loop.
E17. Use residuals of a learned relationship between coupled sensors as the drift signal.
E18. Rank alarms by novelty so a known repeating condition does not flood the operator.
E19. Calibrate the false alarm rate on the 500 fault-free runs and quote the real number in the pitch.
E20. Use the fault-free runs to build an empirical null distribution for every detector statistic.
E21. Detect drift on physically meaningful derived features such as a mass balance residual.
E22. Put the detection moment and the threshold-alarm moment on the same timeline.
E23. Make detection incremental and streaming so the demo can play the data forward in real time.
E24. Support a burn-in period where the system says it is still learning rather than alarming.
E25. Report drift at three zoom levels: per sensor, per unit cluster, per plant.

## F. Root cause attribution

F1. Rank contributing sensors by their contribution to the detector statistic, not by a black box importance score.
F2. Walk the inferred causal graph upstream from the flagged sensor to the earliest deviating ancestor.
F3. Report the earliest mover, not the loudest mover, as the primary suspect.
F4. Produce a narrative chain: this actuator saturated, so this level rose, so this temperature fell.
F5. Test each candidate cause by asking what else it should have affected, then checking whether it did.
F6. Rule out candidate causes explicitly and show the ruled-out list, not only the winner.
F7. Match the deviation pattern to a fault library and report the top three with similarity scores.
F8. Drop the confidence when two fault types explain the data equally well, and say why.
F9. Report the fault in the words a shift operator uses, never as a fault number.
F10. Cite specific timestamps and specific values in the diagnosis so it can be checked by hand.
F11. Separate "what changed" from "why it changed" and admit when only the first is known.
F12. Use the manipulated variables as the tell, since a controller fighting back is often the first evidence of an upset.
F13. Attribute to a control loop rather than a single sensor when the loop as a whole is implicated.
F14. Let the operator ask "why not this other sensor" and get an evidence-based answer.
F15. Produce a one-page case file with timeline, evidence, ranked causes and recommended checks.
F16. Recommend a physical check the operator can perform to confirm or refute the diagnosis.
F17. Show the counterfactual: what the signals would look like had the suspected cause not occurred.
F18. Run a critic pass that tries to break the diagnosis before it is ever shown.
F19. Refuse to name a root cause when the evidence supports only a symptom, and say exactly that.
F20. Keep the whole diagnosis derivable from artifacts already in the log so nothing depends on a live model call.
F21. Order the explanation by what the operator should do first, not by statistical strength.
F22. Quantify how much of the deviation each suspect explains, in percent.
F23. Distinguish a fault from a deliberate operational change by checking for a preceding setpoint move.
F24. Provide an appeal path: the operator marks a diagnosis wrong with a reason and the case reopens under that constraint.
F25. Track diagnosis accuracy across the labeled faults and report it honestly, including the failures.

## G. Human in the loop

G1. Make every claim clickable down to the evidence that produced it, with no dead ends.
G2. Give every output three buttons, accept, question, override, and make each one write to the log.
G3. Make "question" open a dialogue where the model may cite only artifacts, never raw rows.
G4. Make an override sticky: the system remembers the correction and applies it to future runs.
G5. Turn a repeated override into a proposed rule change the operator can accept once and for all.
G6. Show the operator what the system is least sure about first, since that is where their time is worth most.
G7. Give the operator a sensitivity knob with the predicted false alarm rate shown live beside it.
G8. Let the operator label a sensor themselves and have the system flag every inference that conflicts with that label.
G9. Keep a disagreements view where human and machine conclusions differ.
G10. Time-box the operator's attention: the interface promises a decision in under two minutes.
G11. Put a why button on every number in the report.
G12. Make the report readable by someone with no data science background, tested by reading it aloud to a non-engineer.
G13. Show confidence as words plus numbers, since operators distrust a bare percentage.
G14. Let the operator export a case file and send it to an engineer who was not in the room.
G15. Require a human signature before a diagnosis is considered closed.
G16. Show provenance for every model-written sentence: exactly which artifacts were in its context.
G17. Make human overrides first class in evaluation and report how often the system was corrected.
G18. Provide a dry-run mode where the system proposes but never writes.
G19. Build the operator surface as a single scrolling document rather than a dashboard of panels.
G20. Use the terminal as the interface and record the session as the demo, saving hours of UI work.
G21. Let the operator pin a sensor as suspicious and have the system weigh that in the next run.
G22. Show what the system chose not to alarm on, so silence is accountable too.
G23. Let a second operator review and countersign a high-severity diagnosis.
G24. Make the override reason a required free-text field that becomes context for later runs.
G25. Show the operator the exact payload destined for an external model, before it is sent.

## H. Decision log, audit and provenance

H1. Make the log append-only and hash-chained so tampering is detectable.
H2. Log the inputs, the derived artifacts, the model version and the output for every decision.
H3. Make every log entry replayable so a past conclusion can be recomputed and compared.
H4. Log human overrides with the same schema as machine decisions so the record is symmetric.
H5. Export the log as a single JSON lines file that survives without the application.
H6. Give every artifact a content hash and reference artifacts by hash in the log.
H7. Log the reason a check did not run as carefully as the result of one that did.
H8. Sign the exported report so it can be handed to an auditor as evidence.
H9. Map every log field to an EU AI Act record-keeping obligation in a one-page annex.
H10. Show the log growing live during the demo as the receipt for everything just claimed.
H11. Keep a separate egress log listing every class of bytes that left the boundary.
H12. Include a token and cost line per model call so the operator sees what the system spends.
H13. Diff two runs of the pipeline and show what changed and why.
H14. Make the log queryable in plain language, since the log is itself derived data.
H15. Keep the log local by default, with export as an explicit human action.
H16. Record seeds and library versions so a run is reproducible a year later.
H17. Log the confidence and the reason the confidence was not higher.
H18. Timestamp with both the data clock and the system clock and flag when they disagree.
H19. Bundle the decision log into the exported case file so the file stands alone.
H20. Present the log as the real moat: the model can be swapped, the record persists.

## I. Data sovereignty mechanics

I1. Enforce the boundary in code with a typed artifact layer where raw rows simply have no serializer to the model client.
I2. Put an egress proxy in front of every model call that scans the payload and blocks anything resembling a raw record.
I3. Demo the boundary by attempting a raw send on stage and showing it refused.
I4. Show a live byte counter of everything that left the environment during the demo, with the total in kilobytes.
I5. Generate the data flow diagram from the actual egress log rather than drawing it by hand.
I6. Make the model layer one interface with three implementations, local, EU-hosted and frontier, chosen by configuration.
I7. Run the full pipeline once on a local open-weight model on stage to prove no-egress mode.
I8. Report the quality delta between local and cloud models honestly so the choice is informed.
I9. Cache model outputs so the demo never depends on venue wifi.
I10. Hash or pseudonymize any identifier before it can reach a prompt.
I11. Enforce an aggregation threshold so no summary that leaves can describe a single record.
I12. Require a per-call justification field to be filled before an external call is allowed.
I13. Classify artifacts into tiers and bind each tier to the destinations allowed to receive it.
I14. Make the sovereignty policy a file a compliance officer can read and change without touching code.
I15. Show that the report, log and case file are produced locally and are complete with zero cloud calls.
I16. Measure and report the fraction of the pipeline that runs with no model call at all.
I17. Treat the model as an optional narrator over deterministic analytics so the gate is trivially satisfied.
I18. Add a kill switch that severs egress mid-run and show the system continuing in degraded but honest mode.
I19. Log prompt and response hashes rather than content when the content is itself sensitive.
I20. Enforce the boundary at the network level too, running the model client where it has no route out during no-egress mode.
I21. Offer a redaction preview: here is the exact text about to be sent, approve or edit it.
I22. Enforce a maximum payload size so nobody can accidentally stream a table into a prompt.
I23. Treat the plant's rule text as sensitive too, since operating limits are trade secrets.
I24. Record the jurisdiction of each model endpoint and refuse endpoints outside the allowed list.
I25. Produce a dry-run egress report before the first call showing what would leave.
I26. Bind the policy to tests: a suite that fails if any raw row can reach the client.
I27. Make data minimization measurable as a ratio of dataset bytes to prompt bytes.
I28. Frame sovereignty as a cost and latency win too, since summaries are far cheaper than rows.
I29. Let the operator choose the model tier per run with the tradeoff spelled out.
I30. Run the whole demo with the laptop network interface physically disabled.

## J. Adaptability beyond sensors

J1. Define a thin adapter interface so any tabular source becomes timestamped signals.
J2. Run the same pipeline on a messy invoice or order dataset live, changing only a config file.
J3. Prove portability by running a second domain with the core module untouched, shown as a git diff on stage.
J4. Choose a business dataset with real messiness: duplicated records, typo'd categories, impossible dates.
J5. Map business concepts onto the same three buckets of broken data, broken process and changed operating point.
J6. Show a drifting business metric, such as creeping discount percentages, caught by the same detector.
J7. Use free-text logs as a third domain by converting them to counts and rates per window.
J8. Demonstrate the rule compiler on a business rule such as an invoice never exceeding its purchase order.
J9. Show the same evidence cards for business fields, inferring a currency amount from its distribution.
J10. Keep a domain pack concept where knowledge hints live in a swappable file, never in the core.
J11. Prove the core holds no dataset-specific constants with a test that runs it on synthetic random data.
J12. Present the architectural walkthrough as a diagram of what is generic and what is a plugin.
J13. Use a public messy dataset so the second-domain demo needs no partner data at all.
J14. Add a third domain, server logs, to overshoot the bonus capability.
J15. Generate the second-domain dataset yourself with realistic corruption so the demo stays controllable.
J16. Show sensor identity inference becoming column semantic inference in the business domain on the same code path.
J17. Handle irregular timestamps in business data to prove the timeliness checks generalize.
J18. Keep the decision log format literally unchanged across domains.
J19. Report how many lines of domain-specific code the second domain required, and make that number small.
J20. Reuse the same case file export for a business anomaly so the artifact is instantly recognizable.
J21. Frame adaptability as the commercial pitch, since Norrin sells across industries and the pipeline follows them.
J22. Show a failure of generalization honestly and state what it would take to fix.
J23. Define a signal as a timestamped numeric series with metadata and show text becoming exactly that.
J24. Ship two runnable commands, one per domain, so judges can run both themselves.
J25. Build the second domain first and the sensors second, to force the abstraction instead of retrofitting it.

## K. Demo and pitch craft

K1. Open the pitch with the blind test: the column names were hidden, here is what the system inferred, here is the truth.
K2. Run the demo as one terminal session with a recorded video as fallback.
K3. Structure the demo as four beats matching the four judging criteria, in their order.
K4. End with the egress receipt: total bytes that left, and exactly what they were.
K5. Sabotage a sensor live and let the system catch it as a data fault.
K6. Use the reconstructed flowsheet as the hero image of the whole pitch.
K7. Show a naive detector being fooled side by side with ours not being fooled.
K8. Keep the demo under three minutes with everything pre-warmed.
K9. Let a mentor choose which fault to inject, proving nothing is staged.
K10. Invite a mentor to override a conclusion and watch the log entry appear.
K11. Make the local model run the final beat, with the wifi visibly off.
K12. Hand out a single page with every number the pitch claims.
K13. Name the product something an operator would actually say out loud.
K14. Build the pitch around one number, such as minutes of early warning.
K15. Show the system refusing to answer as a feature, not an apology.
K16. Rehearse the ten minute slot as seven of talking plus three of questions, and plant the questions you want asked.
K17. Prepare a two sentence answer to "what happens when the model is wrong".
K18. Prepare a two sentence answer to "how does this scale to a real plant historian".
K19. Make the repo runnable by a judge in one command.
K20. Screenshot every artifact into the slides in case everything live fails.
K21. Show a real false alarm and explain why it is acceptable, since honesty scores here.
K22. Open with the operator's voice, not with the architecture.
K23. Use the challenge's own words in the slide headers so mentors hear their brief echoed back.
K24. Close with what another week would buy, concretely.
K25. Put the "why" chat last, since it is the most impressive and the most fragile.

## L. Uncertainty, self-critique and evaluation

L1. Attach calibrated confidence to every inference and validate that calibration on held-out runs.
L2. Run a critic agent that must try to refute the diagnosis using the same artifacts.
L3. Report the system's own accuracy on the labeled faults, including the ones it misses.
L4. Ensemble across windows and report agreement as confidence.
L5. Show a reliability diagram proving the confidence numbers mean something.
L6. Check that every claim in the report cites an artifact id, and block the ones that do not.
L7. Automatically detect when the model asserts a number absent from the artifacts and refuse to print it.
L8. Provide an uncertainty budget splitting how much comes from data quality and how much from inference.
L9. Prefer to say unknown, and show exactly what evidence would resolve it.
L10. Score the sensor identity report against the known variable list as a public benchmark.
L11. Grade the output with a rubric taken from the judges' own four criteria.
L12. Run on fault-free data and show the system stays quiet, since silence is also a result.
L13. Cross-check the model narrative against the deterministic numbers and flag contradictions.
L14. Report a false alarm rate per day of operation, the number an operator actually cares about.
L15. Use a second cheaper model to verify the first and log every disagreement.
L16. Trace every claim in the final report back to an artifact id automatically and show the coverage percentage.
L17. Test on a fault type never seen and report what the system does.
L18. Test on a corrupted file, not just a corrupted sensor.
L19. Make hallucination measurable in the demo rather than merely claimed absent.
L20. Report compute and wall clock, since a monitor that takes an hour per batch is not a monitor.

## M. Architecture and 40-hour engineering

M1. Precompute everything offline and make the demo a replay so nothing heavy runs on stage.
M2. Convert to Parquet and query with DuckDB so a 250,000 row table is instant.
M3. Keep the model out of the hot loop: it narrates artifacts, it does not compute them.
M4. Build the CLI first and the UI last, since the artifacts are the deliverable.
M5. Use Streamlit for the thin operator surface because it costs two hours, not ten.
M6. Write every artifact to disk so each stage is inspectable and resumable.
M7. Make each stage a pure function with a cached artifact so a failure costs one stage, not the run.
M8. Convert the RData once and never touch R again.
M9. Pin one small local model early and test it before committing to a no-egress claim.
M10. Reserve the last six hours entirely for the pitch and demo rehearsal.
M11. Write the pitch skeleton first and build only what fills it.
M12. Prefer four finished artifacts over eight half-finished ones.
M13. Fake nothing, but precompute everything.
M14. Get the faulty datasets early, since the demo needs faults and only fault-free data is downloaded.
M15. Synthesize a fault by corrupting fault-free data if the faulty files never arrive.
M16. Keep the dependency list tiny so a judge can actually run it.
M17. Use the decision log as the integration test fixture.
M18. Ship a Makefile with one target per required deliverable.
M19. Write the README as a judge's guide, not as developer notes.
M20. Freeze features Saturday midnight and spend Sunday morning on the story.

## N. Wildcards

N1. Give the system a physical metaphor: a stethoscope for plants.
N2. Sonify the drift so the operator hears the plant go out of tune.
N3. Print the case file as a PDF that looks like an incident report an inspector would accept.
N4. Make the evidence cards physical: print them and hand them to the judges.
N5. Let the judges type a plain-language rule at the table and watch it compile and run.
N6. Build a sensor guessing game: the judges guess the column, then see the system's inference.
N7. Have the system explain itself to a child as a readability proof.
N8. Frame the whole thing as a lab notebook that writes itself.
N9. Add a "what would change my mind" section to every diagnosis.
N10. Let the system negotiate: it proposes, the operator counters, they converge.
N11. Animate the inferred plant graph as the fault propagates through it.
N12. Run the pipeline continuously on a synthetic live stream for the whole hackathon and show the uptime.
N13. Write a tiny Rust core for the streaming checks to prove throughput.
N14. Run the pipeline on a Raspberry Pi to make the edge sovereignty point physical.
N15. Run the local model on CPU only so the sovereignty claim needs no GPU.
N16. Publish the evidence cards as a static site judges can browse after the pitch.
N17. Turn the decision log into a timeline scrubber where dragging back replays the state.
N18. Use colour only for confidence so the report stays legible in grayscale.
N19. Add a regulator mode that produces a compliance annex from the same log.
N20. Feed it a fabricated sensor and report honestly whether it invented a role for it.
N21. Have the system grade its own report against the challenge's eight deliverables.
N22. Generate an operator handover note at shift change.
N23. Make the whole system runnable as a cron job that mails a daily briefing.
N24. Produce a "quiet week" summary: nothing happened, and here is the evidence that nothing happened.
N25. Make the system admit when a human already knows more than it does, and ask.
