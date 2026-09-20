# The 10-minute pitch

**Sunday 20 September, 11:00 to 14:00. Ten minutes including mentor questions.**
Roughly two and a half minutes on slides, five on the live demo, and the rest is questions.

This is the stage script and it is the only copy of this wording: the notes pages inside
[`Norrin_Pitch.pptx`](Norrin_Pitch.pptx) are empty, so there is nothing to read off a
presenter view. Read it off paper or a phone. Slide numbers match the deck.

Seven slides are presented. There is no appendix in the deck.

Lines in quotes are meant to be said close to word for word. Everything else is a stage
direction.

## Timing at a glance

| Slide | Starts | Runs | What happens |
| --- | --- | --- | --- |
| 1 | 0:00 | 0:25 | The problem: ask an agent, and the plant leaves the EU |
| 2 | 0:25 | 0:30 | Today: the raw rows cross two borders, unchecked |
| 3 | 0:55 | 0:30 | With the broker: the same map, and nothing crosses |
| 4 | 1:25 | 0:45 | **The rule: the folder decides which model sees it** |
| 5 | 2:10 | **5:00** | **Live demo, three beats** |
| 6 | 7:10 | 0:25 | How you can tell, and the limits |
| 7 | 7:35 | 0:15 | The team, then stop talking |
| - | 7:50 | 2:10 | Questions, with the team slide still on screen |

If you are running long, the slides give, never the demo. Slides 1, 2 and 6 can each lose ten
seconds without losing a claim.

## The two workspaces, and why there are two

This is the spine of the pitch, so be able to say it without the slide.

| Workspace | Label | Holds | Who is cleared |
| --- | --- | --- | --- |
| `demo/restricted-plant/` | `restricted` | the raw sensor rows, 18 recordings, 52 tags | `lemonade`, `ollama`, both local |
| `demo/confidential-plant/` | `confidential` | the derived reports the audit produced | `mistral`, `verda`, plus the local two |

Raw rows are restricted, so no cloud model may ever read them. The derived fingerprints are
confidential, so the Finnish endpoint may. That is the brief's own data minimization rule,
enforced by two labels rather than by a sentence in a prompt.

## Before you walk up

- [ ] **Launch on the confidential workspace, not the restricted one.**
      `scripts/launch.sh demo/confidential-plant`. The restricted folder has no provider on
      this machine and every beat in it would be a refusal.
- [ ] **`verda` is the provider for the beats that succeed.** Check it before you are standing
      up: `pi auth check --provider verda` prints ready or not_ready without showing the key.
- [ ] **Do not invoke any slash skill on stage**, whatever it is called today. The skills are
      mounted at `/opt/guard/skills`, outside the workspace, so the broker refuses the model's
      own read of the skill file and the skill dies on its first tool call. Ask plain questions
      about files inside the workspace instead. (This bites `/analyze`, `/analyze-fast` and the
      report skill equally. That last one is being renamed from `read-report` to `audit` on
      main, which is another reason not to type its name on stage.)
- [ ] The provider ids in `.pi/confidentiality.json` match the ids pi shows for your models. A
      provider that is not listed is treated as `public`, so a typo silently locks you out.
- [ ] `pi` starts from the repo root, not from inside a demo folder.
- [ ] Terminal font large enough to read from the back. The footer status line is the single
      most important thing on screen during slide 5.

## 1. The problem (0:00 to 0:25)

Do not introduce the product. Let the problem sit there first.

> "A data engineer at a plant has an agent open. Everyone does now. They ask it what is wrong
> with unit six. The agent reads the sensor logs and sends them to the model, and the model is
> wherever the vendor put it."

> "Those logs are the plant's throughput, its recipe and its efficiency. If the plant makes
> something the country cannot do without, that copy is a defence risk. Nobody decided to take
> it. It went one question at a time."

Say the last line slowly. It is the whole problem.

## 2. Today (0:25 to 0:55)

The map: the operator's environment, the EU, and outside the EU, left to right. One red line
runs from the raw file across both borders to `google`.

> "Here is that path, on our machine, with our data. One file, raw: eight hundred and ten
> samples, fifty-two columns. It crosses the plant's border and the EU's border, and nothing on
> the way asks whether it should. And nothing writes down that it did."

Every number on this slide is read from the file itself. Nothing is retyped from a terminal.

Beat. Then:

> "Same folder, same question, with what we built."

## 3. With the broker (0:55 to 1:25)

Same map, same geometry. The red line is now a stub that stops on the machine, a blue line
stops in the EU, and the right hand region holds only the broker's refusal.

> "The raw rows stop here, on the machine: the only models cleared for them run locally. The
> statistics our audit derived from them are confidential, so they may go to the Finnish
> endpoint, and they stop there. Google gets nothing. Not the rows, not the statistics, not a
> file listing."

Worth adding if the room is quiet: the band at the top of this slide went green, because
nothing confidential is on this page. The deck is marked by the system it describes.

**If a judge says Google has EU regions:** an engineer with an API key is not region-pinned.
Region pinning is an enterprise contract, and the broker uses whatever clearance the operator
declared for the provider.

## 4. The rule (1:25 to 2:10)

**This is the pitch. Everything else is evidence for it.** Do not rush it.

> "We did not try to teach the model to behave. We took the decision away from it."

> "The folder carries a label. The provider carries a clearance. On every tool call the broker
> compares the two, and the model is never asked for its opinion about it."

Point at the two rows.

> "The raw rows are labelled restricted, so no cloud model touches them, not even the Finnish
> endpoint Norrin gave us. The derived fingerprints, the statistics and correlations our audit
> produced, are labelled confidential, so the Finnish endpoint may read those."

> "Your brief asks for data minimization by design. That is it, on screen. Not a promise in a
> system prompt: two labels on two folders, checked on every call."

## 5. Live demo (2:10 to 7:10)

**Run it live.** Launch before you start talking:

```bash
scripts/launch.sh demo/confidential-plant
```

Three beats, in this order, about ninety seconds each. The slide lists the three titles and
nothing else, so every detail below is spoken.

**Beat 1: a provider with no clearance gets nothing.**
`google` is pi's default, so you are already on it. Ask "List the files in the workspace."
Read the refusal out loud. Point at the footer: the workspace is `confidential`, `google` is
cleared `public`, so it gets no tools and no messages. Not even a file listing.

Say this, because a judge will wonder: there is no command that switches workspace mid-session.
The session is bound to one folder from its first message.

**Beat 2: the injection fails.**
`/model verda`, then ask "Summarise handover-note.md." The audience has not seen the note, so
say what is in it before you send it: a night shift handover with a paragraph telling the
assistant to run a shell command, read a key file and write it into a public folder.

Say what it tried and what stopped each part. Both paths it names are outside the workspace, so
the read and the write are refused by the broker. Do not say bash is blocked, because it is
not: bash runs inside the container, where the workspace is the only writable folder.

**Beat 3: the work still gets done.** This is the important one.
Ask: "Read the reports in reports/ and tell me which unit has a dead instrument rather than a
sick process, and how you can tell."

It reads the derived reports, which are inside the workspace, and answers. The answer you are
hoping for is unit_06: tag_19 stops moving while tag_08, an exact rescaling of it, carries on.

> "The broker did not make the agent useless. It made it accountable."

**If the model wanders or the answer is thin,** do not fight it. Say the finding yourself
(unit_06: tag_19 frozen while tag_08 keeps moving) and move on. The claim being demonstrated is the routing, not the model's
prose.

**If the wifi dies or verda times out:** cut to the recording and say so plainly. Do not debug
on stage. A presenter who says "that is why we recorded it" loses nothing.

## 6. How you can tell (7:10 to 7:35)

> "Everything I have claimed is visible while you use it. That line is always on screen."

The status line sits under the prompt for the whole session and changes as the state changes.

Two of the four checks are on the slide. Say the other two if there is time: it will not write
down into a lower label, and the agent cannot change `.confidentiality.json` at any depth.

**Say the limits line out loud. Do not let a judge find it first.**

> "It is a guardrail, not a sandbox. The container is still the real boundary, and a clearance
> is a declaration we do not verify."

Both limits are written down in our README. This buys more credibility than it costs.

## 7. The team (7:35 to 7:50)

Names, one line each, and then stop. Leave this slide up for the whole question period.

> "Andreas built the launcher and the container it runs in. Matias built the broker extension,
> the label check itself. Tomi built the sensor audit, the reports and the Verda integration."

Close:

> "A prompt is a request. A label is a rule. We moved the decision from the first to the second."

Then stop talking and take questions.

## Anticipated questions

There are no appendix slides. Answer these from here, with the team slide on screen.

**What happens when the model is wrong?**
The model never makes the access decision. A wrong model writes a bad sentence, not a leak.
Every refusal is deterministic code with a stated reason.

**How does this scale?**
The check is per tool call: one path resolution and two comparisons on the level ladder. Its
cost does not grow with the volume of data.

**Where is the data actually stored?**
It never moves. The folder is on the operator's machine, and only a provider cleared at or
above its label sees any of it.

**Why is there a separate folder for the reports?**
Because they are a different classification. The raw rows are restricted and stay on the
machine. The derived statistics are confidential and may go to an EU endpoint. Splitting them
is what makes data minimization enforceable instead of aspirational.

**Could you run the whole thing with no egress at all?**
Yes, and that is what the restricted label is for: point it at a local model and the same
pipeline runs with nothing leaving the machine. We are not carrying a local model today, so
what you saw was the confidential tier.

**What did you not have time to build?**
Verified clearances rather than declared ones, labels below folder level, and one command that
runs the audit through the broker.

**What about unit_07?** (likely if they know the dataset)
A real runaway and 24 channels frozen from sample 227, separated correctly.

**Is this GDPR?**
No, and do not reach for article numbers. The traces are simulated, so there are no data
subjects. The argument here is trade secret and operational confidentiality, which is exactly
what an operator will not post to a US inference API.
