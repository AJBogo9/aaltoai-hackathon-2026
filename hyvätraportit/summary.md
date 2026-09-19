# Plant audit — 18 recordings, 52 unnamed tags

**The files do share a source.** All 18 have identical headers, and per-tag medians agree
tightly across files (tag_01 49.51–50.07, tag_13 338–345, tag_06 2690–2719, and so on for
almost every channel). The same fixed relationships hold in every file — tag_20 = 2.3143·tag_01
− 69.181 with the identical slope 18 times over, tag_11 = tag_02/98.6, tag_33 = 1.0424·tag_06
− 186 — so column identity was inferred from all 18 together. Faults were judged one file at
a time. Sampling is 3 min; some channels update only every 2nd or 5th sample, which makes them
*look* like they lead faster channels. That apparent lead is sampling, not causality, and it has
not been treated as evidence of an actuator (tag_15, tag_16, tag_17, tag_51 all fall in this trap).

**Channels to distrust, by file** — these are instrument or record problems, not the plant:

| file | one-line verdict |
|---|---|
| unit_01 | Clean process. **tag_40** steps +0.11 (7×its noise) at sample 391 and stays — a bias step on a channel nothing else tracks. Distrust tag_40 levels after 391. |
| unit_02 | Clean process. **tag_22** drifts +1.4 (5.5σ) from sample ~300 to the end while every flow it normally follows stays flat — the reading is drifting, not the purity. |
| unit_03 | Clean process. **tag_05** steps +3.6 (6.6σ) at sample 96 and holds. No other channel moves anywhere in the file. |
| unit_04 | **Real plant-wide oscillation from sample ~152 to the end**, amplitude growing; the tag_06/tag_25/tag_33 throughput group leads and 36 other channels follow at 1–90 samples. Instruments are fine. |
| unit_05 | Clean process. **tag_25** wanders +9σ with 5× normal scatter from sample ~410 while its lag-0 twins tag_06 and tag_33 stay put — the tag_25 channel, not the flow. |
| unit_06 | **tag_19 is frozen at 22.57 for samples 500–619** while tag_08 (its exact mirror) keeps moving. A small real 10-sample throughput blip at 671, too minor to act on. |
| unit_07 | **Worst file.** Real runaway excursion from sample ~114 (throughput group leads, tag_02 rails at 100.0, tag_32 at 0.0). Then **24 channels freeze solid from sample 227 to the end** while the plant is still moving — tag_08 keeps climbing to its 100.0 limit. Also 40 rows absent and a block of rows replayed out of order. Trust nothing frozen after 227. |
| unit_08 | Clean process. **tag_35** keeps its mean but loses 6/7 of its noise power and gains memory from sample ~300 — a filtered or re-derived channel. Nothing in the process changed. |
| unit_09 | **Real oscillatory upset, samples 96–430**, led by tag_02/tag_11 and the throughput group; everything recovers. Separately, **tag_33 has 46 missing rows at 299–344**. |
| unit_10 | Clean process. **tag_43 has 15 scattered missing values.** Nothing else. |
| unit_11 | **Real transient upset, samples 156–501**, fully recovered — except **tag_30, which stepped +12σ at sample 168 and never came back.** No channel supports a sustained change at that level; read tag_30 as a sensor that shifted during the upset. |
| unit_12 | Clean. No level, variance or autocorrelation anomaly anywhere. |
| unit_13 | Clean. No level, variance or autocorrelation anomaly anywhere. |
| unit_14 | Process normal. **tag_40 carries 6 sentinel values (999.9 / 0.0)** and is 4× noisier than it should be; **tag_07 has 8 sign-flipped readings** (negative, magnitudes normal); **tag_05 is 6× noisier from sample ~88 with its mean intact.** Three separate instrument problems, no process event. |
| unit_15 | Clean. No level, variance or autocorrelation anomaly anywhere. |
| unit_16 | Clean. No level, variance or autocorrelation anomaly anywhere. |
| unit_17 | **tag_06 samples 399–459 are recorded 10× too small** (26 900 instead of 2 690) — a scale change, not a process fault. A real upset starts in the tag_32/tag_37 pair at sample ~149 and reaches the throughput group 15–37 samples later. Separately, **tag_23 and tag_24 both fall to a new level from sample ~170 in perfect lockstep (r = +0.99 here, ~0.02 normally)** — a shared instrument, not a process variable. |
| unit_18 | **Real sustained oscillation from sample ~160 to the end**, throughput group leading, 36 channels responding. Instruments are fine. |

## What the tags appear to be

Strongest inferences: **tag_06 / tag_25 / tag_33** are the throughput of the unit — they move
together at lag 0 and lead tag_22, tag_39, tag_43, tag_46 by 1–3 samples in 15–18 files out of 18.
Which of the three is the primary cannot be separated from the data, and none of them saturates,
so they are labelled actuated at only ~0.4 confidence. **tag_36** is the clearest actuator: it
leads tag_47 and tag_50 by one sample in all 18 files, integrates (lag-1 level autocorrelation
0.996) and sits on a hard 100.3 limit during upsets — a valve or controller output, with tag_47
the flow it sets. **tag_13** and **tag_43** lag the throughput group with a visible settle, typical
of temperature. **tag_02/tag_11** are one composition in percent and in fraction. **tag_12, tag_45,
tag_48, tag_49, tag_52** update only every 15 minutes — analyser or lab loops. **tag_40** is a fixed
reference at 120.4. Eight channels (tag_01/tag_20, tag_08/tag_19, tag_21/tag_31, tag_03, tag_05,
tag_26, tag_30, tag_35) have no autocorrelation at 3 minutes at all and are left as indeterminate;
four of them are exact rescalings of each other and carry no independent information.
Roughly twenty tags had too little distinguishing evidence to type and are marked indeterminate
at low confidence rather than guessed.
