# Stage 2: probability of winning, and the first cut

## The scale

P = probability our submission wins the Norrin challenge (2,000 EUR) if this idea is a
defining element of it, with the rest of the build held at a competent baseline.

Field assumption: roughly 10 to 14 teams take this challenge, so the base rate for a
competent, unremarkable submission is about 8%. Anything at 8 to 12% is table stakes:
necessary, but it does not move the needle because every serious team will do it.
16 to 20% means a real differentiator. Above 20% means it can carry the pitch.
Below 8% means it costs more than it returns in a 40 hour build.

**Cut line: keep P >= 18%. 89 of 355 survive.**

## Scores

### A. Core product framing
A1 18 keep | A2 12 drop | A3 19 keep | A4 15 drop | A5 16 drop | A6 17 drop | A7 19 keep
A8 11 drop | A9 20 keep | A10 18 keep | A11 16 drop | A12 15 drop | A13 24 keep | A14 16 drop
A15 14 drop | A16 13 drop | A17 16 drop | A18 14 drop | A19 18 keep | A20 15 drop | A21 9 drop
A22 10 drop | A23 15 drop | A24 12 drop | A25 14 drop | A26 12 drop | A27 17 drop | A28 18 keep
A29 17 drop | A30 12 drop

### B. Sensor identity inference
B1 22 keep | B2 17 drop | B3 16 drop | B4 17 drop | B5 15 drop | B6 20 keep | B7 17 drop
B8 18 keep | B9 17 drop | B10 12 drop | B11 16 drop | B12 17 drop | B13 16 drop | B14 12 drop
B15 12 drop | B16 13 drop | B17 13 drop | B18 13 drop | B19 11 drop | B20 20 keep | B21 15 drop
B22 18 keep | B23 26 keep | B24 17 drop | B25 16 drop | B26 14 drop | B27 16 drop | B28 17 drop
B29 20 keep | B30 11 drop | B31 13 drop | B32 10 drop | B33 15 drop | B34 16 drop | B35 19 keep

### C. Broken data versus broken process
C1 16 drop | C2 18 keep | C3 12 drop | C4 14 drop | C5 14 drop | C6 18 keep | C7 22 keep
C8 15 drop | C9 13 drop | C10 12 drop | C11 19 keep | C12 21 keep | C13 19 keep | C14 19 keep
C15 16 drop | C16 12 drop | C17 13 drop | C18 15 drop | C19 16 drop | C20 24 keep | C21 22 keep
C22 20 keep | C23 18 keep | C24 13 drop | C25 12 drop | C26 11 drop | C27 13 drop | C28 9 drop
C29 11 drop | C30 11 drop

### D. Rules to executable checks
D1 19 keep | D2 19 keep | D3 18 keep | D4 17 drop | D5 16 drop | D6 17 drop | D7 13 drop
D8 12 drop | D9 11 drop | D10 16 drop | D11 15 drop | D12 13 drop | D13 12 drop | D14 11 drop
D15 13 drop | D16 18 keep | D17 20 keep | D18 13 drop | D19 10 drop | D20 16 drop

### E. Drift and anomaly detection
E1 21 keep | E2 17 drop | E3 13 drop | E4 14 drop | E5 18 keep | E6 20 keep | E7 10 drop
E8 17 drop | E9 14 drop | E10 15 drop | E11 15 drop | E12 14 drop | E13 13 drop | E14 15 drop
E15 12 drop | E16 11 drop | E17 17 drop | E18 12 drop | E19 18 keep | E20 17 drop | E21 16 drop
E22 19 keep | E23 16 drop | E24 13 drop | E25 14 drop

### F. Root cause attribution
F1 20 keep | F2 21 keep | F3 20 keep | F4 20 keep | F5 19 keep | F6 18 keep | F7 15 drop
F8 15 drop | F9 16 drop | F10 17 drop | F11 16 drop | F12 17 drop | F13 13 drop | F14 16 drop
F15 17 drop | F16 17 drop | F17 13 drop | F18 17 drop | F19 18 keep | F20 16 drop | F21 14 drop
F22 15 drop | F23 15 drop | F24 15 drop | F25 17 drop

### G. Human in the loop
G1 17 drop | G2 18 keep | G3 18 keep | G4 20 keep | G5 19 keep | G6 16 drop | G7 13 drop
G8 15 drop | G9 14 drop | G10 12 drop | G11 16 drop | G12 16 drop | G13 13 drop | G14 13 drop
G15 12 drop | G16 17 drop | G17 15 drop | G18 12 drop | G19 14 drop | G20 14 drop | G21 12 drop
G22 15 drop | G23 9 drop | G24 13 drop | G25 19 keep

### H. Decision log and provenance
H1 16 drop | H2 16 drop | H3 17 drop | H4 17 drop | H5 15 drop | H6 14 drop | H7 12 drop
H8 12 drop | H9 14 drop | H10 17 drop | H11 20 keep | H12 13 drop | H13 13 drop | H14 12 drop
H15 14 drop | H16 13 drop | H17 15 drop | H18 11 drop | H19 16 drop | H20 14 drop

### I. Data sovereignty mechanics
I1 22 keep | I2 21 keep | I3 23 keep | I4 21 keep | I5 20 keep | I6 19 keep | I7 20 keep
I8 16 drop | I9 15 drop | I10 12 drop | I11 12 drop | I12 14 drop | I13 16 drop | I14 16 drop
I15 18 keep | I16 15 drop | I17 20 keep | I18 17 drop | I19 11 drop | I20 15 drop | I21 17 drop
I22 14 drop | I23 12 drop | I24 13 drop | I25 17 drop | I26 19 keep | I27 18 keep | I28 13 drop
I29 13 drop | I30 19 keep

### J. Adaptability
J1 19 keep | J2 22 keep | J3 20 keep | J4 17 drop | J5 17 drop | J6 16 drop | J7 14 drop
J8 17 drop | J9 15 drop | J10 17 drop | J11 15 drop | J12 15 drop | J13 16 drop | J14 13 drop
J15 15 drop | J16 19 keep | J17 13 drop | J18 16 drop | J19 17 drop | J20 15 drop | J21 15 drop
J22 14 drop | J23 17 drop | J24 16 drop | J25 16 drop

### K. Demo and pitch craft
K1 22 keep | K2 17 drop | K3 19 keep | K4 20 keep | K5 22 keep | K6 19 keep | K7 20 keep
K8 16 drop | K9 19 keep | K10 18 keep | K11 19 keep | K12 13 drop | K13 14 drop | K14 17 drop
K15 18 keep | K16 15 drop | K17 15 drop | K18 15 drop | K19 16 drop | K20 15 drop | K21 16 drop
K22 16 drop | K23 16 drop | K24 14 drop | K25 13 drop

### L. Uncertainty, critique, evaluation
L1 16 drop | L2 17 drop | L3 18 keep | L4 13 drop | L5 13 drop | L6 20 keep | L7 20 keep
L8 15 drop | L9 17 drop | L10 17 drop | L11 16 drop | L12 18 keep | L13 18 keep | L14 16 drop
L15 13 drop | L16 20 keep | L17 15 drop | L18 13 drop | L19 18 keep | L20 13 drop

### M. Architecture and 40 hour engineering
M1 17 drop | M2 16 drop | M3 19 keep | M4 16 drop | M5 15 drop | M6 16 drop | M7 14 drop
M8 14 drop | M9 16 drop | M10 18 keep | M11 19 keep | M12 18 keep | M13 16 drop | M14 20 keep
M15 17 drop | M16 14 drop | M17 12 drop | M18 13 drop | M19 16 drop | M20 17 drop

### N. Wildcards
N1 10 drop | N2 8 drop | N3 15 drop | N4 11 drop | N5 20 keep | N6 16 drop | N7 10 drop
N8 13 drop | N9 17 drop | N10 12 drop | N11 15 drop | N12 10 drop | N13 5 drop | N14 9 drop
N15 15 drop | N16 12 drop | N17 12 drop | N18 10 drop | N19 14 drop | N20 18 keep | N21 17 drop
N22 12 drop | N23 10 drop | N24 13 drop | N25 13 drop

## The 89 survivors

A1, A3, A7, A9, A10, A13, A19, A28
B1, B6, B8, B20, B22, B23, B29, B35
C2, C6, C7, C11, C12, C13, C14, C20, C21, C22, C23
D1, D2, D3, D16, D17
E1, E5, E6, E19, E22
F1, F2, F3, F4, F5, F6, F19
G2, G3, G4, G5, G25
H11
I1, I2, I3, I4, I5, I6, I7, I15, I17, I26, I27, I30
J1, J2, J3, J16
K1, K3, K4, K5, K6, K7, K9, K10, K11, K15
L3, L6, L7, L12, L13, L16, L19
M3, M10, M11, M12, M14
N5, N20

## Lessons from the discard pile (carried forward as context)

1. **Metaphor alone does not score.** Courtroom, stethoscope, emergency room, insurance
   underwriter (A2, A21, A22, N1) are pitch decoration. The judging criteria are mechanical,
   so a framing only survives if it forces a mechanism (triage forces the data-before-process
   gate, airlock forces the egress boundary).
2. **Table stakes are invisible.** Missing values, out-of-range checks, duplicate timestamps
   (C4, C8, C10, C16) all score around 12 to 15: required by the brief, so doing them well
   earns no separation. They must exist, they must not be the story.
3. **Statistics that identify one sensor type are commodities.** B11 to B19 are each a good
   trick, but a judge cannot tell twelve tricks apart in three minutes. What separates is the
   protocol around them: hidden names, a falsifier per claim, a held-out re-inference.
4. **Anything needing a second model, a training run or a UI framework is a time trap.**
   Autoencoders (E7), a Rust core (N13), a Raspberry Pi (N14), countersigning workflows (G23)
   all lose to the clock. 40 hours minus sleep is roughly 26 working hours.
5. **Audit features are hygiene, not narrative.** Hash chains, signatures, JSON lines exports
   (H1, H5, H8) score 12 to 16 individually. Only the egress log (H11) breaks out, because it
   is the one log that is evidence for the gate criterion rather than evidence for tidiness.
6. **Claims without a live test are worth little.** "We are careful with data" loses to a
   blocked send on stage. Every sovereignty idea that scored above 20 has an on-stage moment
   attached to it (I3, I4, I30), and every one that scored below 15 is a policy document.
7. **Adaptability sold as architecture is weaker than adaptability run live.** J12 (a diagram
   of what is generic) scores 15, J2 and J3 (same binary, second dataset, untouched core,
   shown as a diff) score 20 to 22. The brief allows a walkthrough, but a run beats it.
8. **Detection sophistication is not the axis of competition.** E1 (PCA with contributions) is
   the 1990s textbook method for exactly this dataset and it scores higher than anything
   fancier, because contributions are attributable and attribution is what is being judged.
9. **The dataset leaks its own answer.** The columns are named xmeas and xmv, which hands over
   the measured versus manipulated split that the brief asks the system to infer. Any idea that
   quietly uses the names is worth close to zero. This single fact makes B23 the highest scoring
   sentence in the entire fan-out: hide the names, infer, then reveal and grade.
