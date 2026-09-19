# Stage 5: the three finalist pitches

The slot is ten minutes including mentor questions, so each script is five minutes of talking
and leaves five for questions. Every number written as [measure] is a placeholder to be filled
with a real measured value, never invented. All three pitches close on the same twenty seconds,
because the gate is pass/fail and the cheapest way to pass it visibly is to end on it.

---

# PITCH 1 (recommended): "Triage"

**Premise in one line:** a monitor that checks whether the data can be trusted before it says
anything about the process, and refuses to diagnose when it cannot.

**Spine:** S2, data quality. **Borrowed beats:** the blind reveal (S1), the causal narrative
(S6), the live second domain (S5), the airlock close (S3), the blocked hallucination (S4).

## Script

**0:00 to 0:35, the trap**

"A sensor drifts for six weeks. Every reading stays inside its range, so no alarm fires. When
product quality finally drops, someone spends a day in the historian. That is your slide, and
it is the easy half of the problem. The hard half is this: a sensor that has quietly died looks
exactly like a process going wrong, and if your monitor confuses the two it sends an operator
to fix a reactor when the actual job was to replace a thermocouple. So we built the monitor
backwards from most: it decides whether it can trust the data before it is allowed to have an
opinion about the plant."

**0:35 to 1:15, the blind reveal**

"First, it does not know what any of these columns are. We hash the column names before the
pipeline sees the file, so the system works from numbers only." Show the anonymous table.
"Twenty statistics per column, a lagged correlation graph across all 1,326 pairs, and it
separates actuators from measurements on quantization, bounded range and which one moves first.
Here is what it said column 44 was, and why: bounded zero to one hundred, 
[measure] quantization steps, it leads its three neighbours by [measure] samples. It called it a
valve position. Now we reveal the real names." Reveal. "[measure] of 52 roles correct, and every
one of them carries the statistic that would have overturned it."

**1:15 to 2:15, the fault**

"Now we play a faulty run forward." Stream the replay. "It flags at sample [measure]. A
conventional range alarm on the same data fires at sample [measure], which is [measure] minutes
later." Point at the two markers on one timeline. "And the flag is not a score, it is a
decomposition: these four sensors contribute [measure] percent of the deviation. It ranks them
by which moved first, not which moved most, then walks upstream through the graph it built in
beat one and writes this." Show the chain. "The A feed valve saturated at 100 percent, so the
reactor level rose, so the separator temperature fell. Three links, each citing a timestamp and
a value you can check by hand. It also publishes what it ruled out and why."

**2:15 to 3:15, the sabotage**

"Watch what happens when the data is the problem instead." Freeze a column live. "Same stream,
one sensor now frozen at a perfectly plausible value, still inside its range. On the left is a
standard anomaly detector: it reports a process fault. On the right is ours: it reports a dead
instrument, names the sensor, and refuses to produce a diagnosis at all." Show the refusal.
"Two reasons it can tell. The noise floor vanished, and a real level under control still
jitters. And its neighbours did not move, so the plant did not change, the instrument did. Every
flag we produce lands in exactly one of three buckets: broken data, broken process, changed
operating point. The refusal is the feature. Trust score [measure], below threshold, and here is
the exact check that blocked it."

**3:15 to 4:00, the operator**

"An operator can accept, question or override anything on this screen." Click question. "It
answers from the derived artifacts, not from the raw data, and every sentence cites the artifact
it came from. Any number in that answer that does not appear in a cited artifact is blocked
before it is printed, and this run blocked [measure] of them." Click override. "I disagree, this
one is a real process fault, and here is why. That override is logged with my name and my
reason, it is applied on the next run, and when the same correction happens twice the system
drafts a rule change and asks whether to adopt it. The log is symmetric: machine decisions and
human decisions in the same schema."

**4:00 to 4:40, the second domain**

"None of what you just saw is about chemistry." Switch datasets. "Same binary, different config,
a table of purchase orders with duplicate entries, typo'd suppliers and impossible dates. Same
four artifacts: what each column is, what is broken in the data, what is drifting, and what is
causing it. It found discount percentages creeping upward on one supplier, and it separated that
from 1,400 rows that were simply entered twice. Here is the diff for the second domain: an
adapter and a config file. The core did not change."

**4:40 to 5:00, the receipt**

"Last thing. Raw rows never left this laptop. Not by policy, by type: raw frames have no path to
a model client, and here is the test that fails if anyone gives them one. [measure] megabytes of
sensor data in, [measure] kilobytes of derived summaries out, every call logged with destination
and justification. Watch me try to break it." Run the deliberate raw send, show it refused and
logged. "And the run you just watched was on a local open-weight model with the wifi off."

## What must exist by Sunday 09:00

1. Hashed-name pipeline and the reveal scorecard.
2. Fingerprint vector, correlation graph, actuator versus measurement split.
3. Neighbour regression bank: bias, noise floor collapse, coherent cluster residual.
4. Trust score plus a hard gate that prevents the diagnosis stage from running.
5. Replay harness with a live corruption injector, plus a naive baseline detector to lose.
6. PCA contributions, earliest-mover ranking, upstream walk, narrative renderer.
7. Operator surface with accept, question, override, sticky overrides, symmetric log.
8. Airlock type boundary, egress ledger, byte counter, policy test, local model path.
9. Second-domain adapter plus a messy business table.

## Risks and fallbacks

- Faulty datasets do not arrive: corrupt fault-free runs into synthetic drift and say so plainly.
- Local model too slow or bad: cache its outputs from a rehearsal run and show the cache is a
  cache, never claim it is live.
- Live injection crashes: the recorded video plays instead, and the crash is not hidden.
- The correlation graph is dense: prune to the three strongest edges per node, show the pruning
  rule on screen.

## Three questions, prepared

- *What happens when the model is wrong?* Every number comes from deterministic code and the
  model only phrases it, so a wrong model produces a bad sentence, not a bad number, and the
  citation check blocks the sentence. [measure] claims were blocked in the run you saw.
- *How does this scale to a real historian?* The expensive part is the pairwise graph, which is
  quadratic in sensors and computed once per baseline, not per batch. Per batch it is a few
  matrix multiplies, so a thousand-tag plant is minutes on a baseline and milliseconds on a batch.
- *What did you not have time to build?* Operating-mode aware rules, so a startup does not trip
  steady-state limits, and calibration of the confidence numbers against outcomes.

---

# PITCH 2: "Rosetta"

**Premise in one line:** hand it an undocumented plant and it writes the documentation, with the
evidence for every line, and everything else it does is built on top of that.

**Spine:** S1, understanding. **Borrowed beats:** the refusal (S2), the rule compiler (S7), the
airlock close (S3).

## Script

**0:00 to 0:30, the premise.** "Here is the file we were given: 52 columns called xmeas_1 to
xmv_11, no documentation, no units, no tag list. This is not an artificial situation. It is what
a historian export from a twenty year old plant actually looks like when the engineer who named
the tags has retired. Before anyone can monitor this, somebody has to work out what it is, and
that somebody is usually a consultant with six weeks."

**0:30 to 1:35, the decipherment.** "We hashed the column names before the pipeline saw them, so
it cannot cheat, and we told it nothing about chemical plants beyond what any engineer knows.
Twenty statistics per column and a lagged correlation graph over all 1,326 pairs. Here is one
card of 52." Walk one card: role, confidence, three statistics, falsifier, neighbours. "Bounded
zero to one hundred, quantized, saturates, and it leads three other signals. That is an actuator,
and specifically a valve. The falsifier is stated: if it were not quantized, this call would
collapse. Now the reveal." Show the scorecard. "[measure] of 52 correct, [measure] partly correct,
and the ones it got wrong, it had already flagged as low confidence."

**1:35 to 2:20, the hero image.** "Orient every edge by the sign of the lag and you get more than
a list. You get the plant." Show the inferred flowsheet beside the real Tennessee Eastman
diagram. "It has never seen this diagram. It found the reactor cluster, the separator cluster and
the stripper cluster, and it found the recycle, because a recycle is a cycle in the graph."

**2:20 to 3:05, rules on top.** "Because it knows what the columns are, rules can be written in
English about things, not about column numbers." Hand the keyboard to a mentor. "Type an
operating limit." Compile it, show the sentence beside the compiled check, backtest it: "this
rule would have fired on [measure] percent of normal operation, accept or reject."

**3:05 to 3:55, the fault.** Drift flagged, contributions, upstream walk through the graph from
beat two, narrative chain with citations, ruled-out list.

**3:55 to 4:35, the refusal.** Freeze a sensor live, show the data-versus-process separation and
the refusal to diagnose, with the naive detector failing beside it.

**4:35 to 5:00, the receipt.** Same close as Pitch 1: type boundary, ratio, blocked send, wifi
off.

## Why it might beat Pitch 1

The opening is stronger and the flowsheet is the most memorable single artifact available in this
challenge. If the graph comes out clean, this is the pitch people describe to other teams
afterwards.

## Why it might lose

Criterion 2 becomes a forty second beat instead of the spine, and criterion 2 is where the field
is weakest and therefore where separation is cheapest. The flowsheet is also the only artifact
in the entire brainstorm whose quality cannot be guaranteed by effort: a densely coupled
closed-loop plant can produce a hairball, and then the hero image is a liability. Build it, and
promote it to the spine only if Saturday evening's render is legible.

---

# PITCH 3: "Bedrock"

**Premise in one line:** one core, two domains, and the sensor plant is only the first one.

**Spine:** S5, adaptability. **Borrowed beats:** everything else, compressed.

## Script

**0:00 to 0:30.** "Two problems that look unrelated. A sensor drifts out of calibration over six
weeks and nobody sees it because every reading is in range. A purchasing system accumulates
thousands of small manual-entry errors and nobody sees it because every record passes validation
on its own. They are the same problem: an unexplained deviation from expected behaviour, hiding
inside individually valid data. We built one engine and pointed it at both."

**0:30 to 1:25, sensors.** Fast montage of the four artifacts on the sensor data, with the blind
reveal compressed into fifteen seconds and the diagnosis into thirty.

**1:25 to 2:30, business.** Same binary, purchase orders. "It does not know what a supplier is.
It sees a bounded categorical, a currency-shaped distribution and a timestamp, and it produces
the same evidence cards. It found 1,400 duplicate entries, a supplier whose discount percentage
has drifted upward for five months, and forty records dated in the future. Broken data, broken
process, changed operating point, the same three buckets."

**2:30 to 3:10, the proof.** "Here is the entire diff between the two runs." Show it. "An adapter
and a config file, [measure] lines. The core has no column names in it, no thresholds and no
chemistry. And the same English sentence compiles into a check in both domains."

**3:10 to 3:50, data quality and refusal**, shown in the business domain, because a duplicated
invoice is a broken record and a shifted discount is a broken process, and the monitor refuses
to diagnose when the table itself cannot be trusted.

**3:50 to 4:30, the operator loop**: question, override, sticky, logged, drafted into a rule.

**4:30 to 5:00, the receipt**, as above.

## Why it might beat the others

Criterion 4 is explicitly listed and the brief offers an easy escape hatch, an architectural
walkthrough, which most teams will take. Running it live is strictly stronger, and the
commercial subtext lands with a consultancy that sells across industries: this follows you to
the next client.

## Why it might lose

It spends its most valuable minutes on a spreadsheet. The sensor work still has to be good, so
the cost is added rather than traded, and if the business run is thin the whole spine looks like
a demo trick.

---

# Recommendation

Build **Pitch 1**, with the Rosetta opening as beat two and the Bedrock run as beat six. It is
the composite the funnel converges on: the spine sits on the criterion the field is weakest on,
the opening borrows the strongest forty seconds available, the adaptability beat is ninety
seconds rather than a slide, and the gate is proved in the last twenty seconds rather than
claimed in the first.

One ordering decision matters more than the rest: the Signal type and both adapters are defined
at hour zero, before any analysis code is written, because that is the only part of Pitch 1 that
cannot be added on Sunday morning.
