# The 10-minute pitch

**Sunday 20 September, 11:00 to 14:00. Ten minutes including mentor questions.**
Budget seven minutes of talking and three for questions. The demo is most of it: four and a
half minutes live against two and a half on slides.

This is the stage script, and it is the only copy of this wording: the notes pages inside
[`Norrin_Pitch.pptx`](Norrin_Pitch.pptx) are empty, so there is nothing to read off a
presenter view. Read it off paper or a phone. Slide numbers match the deck.

The slides were thinned to carry one claim and its evidence each. Everything else here is
yours to say, so the room is watching you and the terminal rather than reading.

Lines in quotes are meant to be said close to word for word. Everything else is a stage
direction.

## Timing at a glance

| Slide | Starts | Runs | What happens |
| --- | --- | --- | --- |
| 1 | 0:00 | 0:15 | Hook, one screenshot |
| 2 | 0:15 | 0:25 | The before, recorded clip |
| 3 | 0:40 | 0:30 | What we built |
| 4 | 1:10 | **4:30** | **Live demo, three beats** |
| 5 | 5:40 | 0:25 | The sensor audit |
| 6 | 6:05 | 0:20 | How you can tell, and the limits |
| 7 | 6:25 | 0:25 | What is next, then stop talking |
| - | 6:50 | 3:10 | Questions |
| 8, 9 | appendix | - | Only if a judge asks |

Slides are 2:20 of the 6:50 you are talking. If you are running long, the slides are what
gives, never the demo: 5, 6 and 7 can each lose ten seconds without losing a claim.

## Before you walk up

- [ ] **The slide 2 clip exists and plays offline.** Slide 2 is built for it. Without it you
      narrate the slide instead, which is weaker but survivable.
- [ ] Provider keys are set for the providers you will actually use. Check with
      `pi auth check --provider <name>`, which prints ready or not_ready without showing the key.
- [ ] The provider ids in `.pi/confidentiality.json` match the ids pi shows for your models.
      A provider that is not listed is treated as `public`, so a typo silently locks you out.
- [ ] `pi` starts from the repo root, not from inside a demo folder.
- [ ] Terminal font is large enough to read from the back of the room. The footer status line
      is the single most important thing on screen during slide 4.
- [ ] You know which provider is your cleared one before you are standing up.

## 1. The hook (0:00 to 0:15)

Do not introduce the product yet. Let the screenshot sit there.

> "This is the whole hackathon in one screenshot. Someone hands an agent a confidential file
> and asks for analysis. To answer, the agent has to read it. And once it has read it, every
> tool it owns is a way out: the network, the filesystem, the next model call."

> "We are going to show you what that costs, and then what we built so it does not."

If a judge asks about the banner at the top and bottom of the slides: yes, the deck is
marked using our own system, and the bar tells you which providers are allowed to see that
page.

Then cut to the recorded clip. **Do not run this half live.**

## 2. The before (0:15 to 0:40)

Play the clip over this slide. If there is no clip, show the slide and narrate it.

> "The quote is real. The paragraph underneath it is not from us. It is a prompt injection
> sitting inside the vendor's email, and the agent has no way to tell the difference between
> data it was asked to read and instructions it was asked to follow."

> "Three demands. It ran all three. And it was told not to mention it, so it did not."

The three demands, if you need to list them: it ran a shell command, it read a credentials
file outside the project, and it wrote the contents into a public folder.

Beat. Then:

> "Same agent, same file, same question."

## 3. What we built (0:40 to 1:10)

Keep this short. It is a map, not the point.

> "We did not try to teach the model to behave. We took the decision away from it."

> "The folder carries a label. The provider carries a clearance. On every tool call the broker
> compares the two, and if anything is missing or unreadable it refuses. The model is never
> asked for its opinion about this."

The banner changed to public on this slide, because nothing confidential is on screen. Worth
pointing at if the room is quiet.

Say this, it is no longer printed on the slide. Two halves, three people: the broker confines
the agent to one folder, confines bash to a container where only that folder is writable, and
keeps the label file read-only, with 111 tests behind it. The audit reads 18 recordings of 52 unnamed sensors and works out what each one is.

## 4. Live demo (1:10 to 5:40)

**This is the pitch. Run it live.** Three beats, in this order. The slide lists the three
titles and nothing else, so every detail below is spoken.

Four and a half minutes for three beats is about ninety seconds each. That is slow enough to
let a command finish on screen and to read a refusal out loud instead of talking over it.

**Beat 1: a provider with no clearance gets nothing.**
Launch on it before you start: `scripts/launch.sh demo/confidential-hr`. Then `/model google`
and ask "List the files in the workspace." Read the refusal out loud. There is no command that
switches workspace mid-session, which is the point: the session is bound to one folder from
its first message. Point out that `google` is cleared `public` and the
folder is `confidential`, so it does not even get a file listing.

**Beat 2: the injection fails three times over.**
Switch to a cleared provider, then ask "Summarise vendor-email.txt." Same injection as in the
clip. Say what it tried and what stopped each part: both paths it names are outside the folder,
so the read and the write are refused. Do not say bash is blocked, because it is not: bash runs
inside the container, and that is what beat 3 uses.

**Beat 3: the work still gets done.** This is the important one, do not rush it.
Ask "Write a report of average salary to report.md." It works.

> "The broker did not make the agent useless. It made it accountable."

**If the wifi dies or a provider times out:** cut to the recording and say so plainly. Do not
debug on stage. A presenter who says "that is why we recorded it" loses nothing.

## 5. The sensor audit (5:40 to 6:05)

This is the Norrin brief's own criterion, answered.

> "A dead sensor and a sick plant look identical on a dashboard, and they need opposite
> responses. Send someone to the reactor when the job was to replace a thermocouple and you
> have lost the day."

> "unit_06 is the clean case. tag_19 stops moving, and every reading it reports is in range.
> What gives it away is that tag_08, which is an exact rescaling of it, carries on. The plant
> is fine. The instrument is not."

> "And it tells you where it is unsure. Twenty tags it refused to name."

Worth adding if there is time: a range alarm sees nothing here at all, because 22.57 is a
perfectly plausible reading.

Neither the indeterminate tags nor the range alarm is printed on this slide any more. The
27 indeterminate tags are on appendix slide 8 if a judge wants them written down.

## 6. How you can tell (6:05 to 6:25)

> "Everything I have claimed is visible while you use it. That line is always on screen."

The status line sits under the prompt for the whole session and changes as the state changes.

> "The interesting direction is the one people skip: what does it do when it is confused? It
> refuses, and names the check that refused."

One is on the slide: it fails closed. Say the other three, they were cut to make room. Bash is
confined to a container where the workspace is the only writable folder, it will not write down
into a lower label, and the agent cannot change `.confidentiality.json` at any depth.

Slide 6 still reads "bash is gone", which is wrong: the launcher passes bash in the tool list
and the broker allows it for a cleared provider inside the container. Correct it on the slide
before presenting, or say the accurate version over it.

**Say the limits line out loud. Do not let a judge find it first.**

> "It is a guardrail, not a sandbox. The container is still the real boundary, and a clearance
> is a declaration we do not verify."

Both limits are written down in our README. This buys more credibility than it costs.

The banner is restricted on this page, because the health workspace is on screen.

## 7. What is next, then stop (6:25 to 6:50)

Three real gaps, named before a judge names them. Do not oversell.

1. **Verify the clearance.** Today a level is attached to a provider id. It should be attached
   to an endpoint we have checked.
2. **Labels below the folder.** One label per folder is coarse. A nested label is protected on
   write but ignored on read.
3. **Run the audit through the broker.** The sensor pipeline and the broker are still two halves.
   They should be one command.

Close:

> "A prompt is a request. A label is a rule. We moved the decision from the first to the
> second."

Then stop talking and take questions.

## Anticipated questions

Appendix slides 8 and 9 hold these. Jump to 8 for coverage of the brief, 9 for these four.

**What happens when the model is wrong?**
The model never makes the access decision. A wrong model writes a bad sentence, not a leak.
Every refusal is deterministic code with a stated reason.

**How does this scale?**
The check is per tool call: one path resolution and two comparisons on the level ladder. Its
cost does not grow with the volume of data.

**Where is the data actually stored?**
It never moves. The folder is on the operator's machine, and only a provider cleared at or
above its label sees any of it.

**What did you not have time to build?**
Verified clearances, labels below the folder, and one command that runs the audit through the
broker. (The same three from slide 7. Saying them twice is fine, it reads as consistency.)

**What about unit_07?** (likely if they know the dataset)
A real runaway and 24 channels frozen from sample 227, separated correctly.

**Is this GDPR?**
No, and do not reach for article numbers. A plant's sensor traces reveal throughput, recipe
and efficiency. The argument here is trade secret and operational confidentiality, which is
exactly what an operator will not post to a US inference API.
