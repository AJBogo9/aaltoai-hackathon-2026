# Telegram-ready (3 messages, paste one at a time)

---- MESSAGE 1 ----

**Idea funnel for the Norrin challenge: 355 ideas, 3 finalists**

Scored every idea by "chance this wins the challenge if it is our defining element". Baseline for a competent but unremarkable submission is ~8% (10 to 14 teams on this challenge). Funnel: 355 sentences, 89 survive, 26 survive, 8 candidate systems, 3 finalists.

One finding shaped everything: **the dataset leaks its own answer**. The columns are literally named xmeas_* and xmv_*, which gives away the measured vs manipulated split that the brief asks the system to infer. So: hash the column names before the pipeline sees them, run blind, reveal and score at the end. Highest scoring single idea out of all 355.

**1. "Triage" (31%) <- recommended**
Spine: a dead sensor is not a process fault.

One mechanism carries the whole build: regress every signal on its correlated neighbours over fault-free data, then read the residuals three ways.
• persistent bias on one signal, neighbours fine = calibration drift
• noise floor vanished, value still plausible = frozen sensor
• residual moves coherently across a cluster = real process fault

That feeds a hard gate: trust score first, and if the data cannot be trusted the diagnosis stage never runs, it names the check that blocked it.

Demo moment: we freeze a sensor live on stage. Standard anomaly detector on the left calls it a process fault. Ours names the instrument and refuses to diagnose.

Why it wins: data quality is one of the four scored criteria and it is the one the field will be weakest on, because it is unglamorous. It is also Norrin's own slide played back at them.
Weakness: boring opening, so we borrow the blind reveal as beat 2.

---- MESSAGE 2 ----

**2. "Rosetta" (29%)**
Spine: hand it an undocumented plant and it writes the documentation.

Column names hashed, so it works from numbers only. ~20 statistics per column, lagged correlation graph over all 1,326 pairs, actuators separated from measurements by quantization, bounded range and which one moves first. Output is an evidence card per sensor: role, confidence, the three statistics behind it, and the falsifier (the statistic that would overturn the call). Then we reveal the real names and score it.

Hero image: orient every edge by the sign of the lag and you do not get a list, you get the plant. The reconstructed flowsheet goes on screen next to the real Tennessee Eastman diagram, and it has never seen that diagram.

Extra beat: a mentor types an operating limit in plain English at the table, it compiles into an executable check and backtests itself on fault-free history ("this rule would have fired on 0.3% of normal operation, accept or reject").

Why it wins: strongest opening available, and it owns the autonomy criterion. A system that never saw a label cannot have been hand-tuned to one.
Weakness: the flowsheet is the only artifact whose quality effort cannot guarantee. A densely coupled closed-loop plant can render as a hairball. Build it, promote it to the spine only if Saturday evening's render is legible.

---- MESSAGE 3 ----

**3. "Bedrock" (27%)**
Spine: one core, two domains, and the sensor plant is only the first one.

A sensor drifting out of calibration and a purchasing system accumulating manual-entry errors are the same problem: an unexplained deviation hiding inside individually valid data. So we build one engine and point it at both. Same binary, different config, on a messy purchase-order table: duplicate entries, typo'd suppliers, impossible dates. Same four artifacts out.

The proof is the diff between the two runs: an adapter and a config file. No column names, no thresholds and no chemistry in the core.

Why it wins: adaptability is an explicitly scored criterion, and the brief offers an escape hatch (an architectural walkthrough) that most teams will take. Running it live is strictly stronger, and the commercial subtext lands with a consultancy: this follows you to the next client.
Weakness: it spends the best minutes of the pitch on a spreadsheet.

**Recommendation:** build Triage, with the Rosetta blind reveal as beat 2 and the Bedrock second-domain run as beat 6. Five minutes of talking, five left for mentor questions.

**Two things to settle now:**
• The faulty datasets. We only have fault-free training on disk, and every fault, drift and diagnosis beat depends on the faulty files. Someone pull them tonight.
• The Signal type and the adapters get defined at hour zero. It is the one decision that cannot be added on Sunday morning.
