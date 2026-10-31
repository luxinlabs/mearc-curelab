# CureLab demo — β-cell research, two independent scientists

## Case and setup

**Question:** “In a simulated pancreatic β-cell assay at 11 mM glucose, how does Candidate A at 10 µM compare with vehicle and a positive control on insulin secretion and viability?”

**Protocol:** 8 replicate wells per group; 24 wells total; seed 42. Candidate A is a placeholder, not a real drug. Measurements come from a seeded toy model, not a wet lab or a validated biological model. The 3D view is illustrative. The initial protocol is a template that a human can edit and approve; it is not automatically derived from all agent suggestions.

The judging slide allows **two minutes for the live final**. Use the core script below; add the optional segment only if given up to three minutes. Rehearse with a stopwatch, allowing time for agent speech.

Before presenting:

- Restart the backend after pulling the latest code, refresh the browser, and check live mode, OpenAI/Groq, Freestyle and Relay connectivity. Keep credentials off-screen.
- Use a genuine session already at the shared-discussion stage. Test both voices, then click **Listen to discussion**. OpenAI uses nova and Groq uses onyx. Narration is a one- or two-sentence summary; full text stays in chat. Independent proposals are silent.
- Keep a genuinely completed 24-well run and its Scientific PR ready in a second tab. Identify it as a previously completed run when switching. Do not wait for provisioning, initial research or a whole experiment during the two-minute final.
- Expand a current-session agent workspace and identify a real Relay delivery entry in its logs or the exported audit. A configured connection or a voice preview alone does not prove a peer message was delivered.
- Prepare the exact human intervention below. If a service is slow, show its actual pending status, move on, and return only if time permits. Do not describe a response as incorporating advice until it actually does.

## Core script — approximately two minutes

### 0:00–0:18 · The question
**Show:** Laboratory, mission question and 3D cells.

> “This is CureLab, a human-led research workspace for two independent AI scientists. Our case is β-cell function: can a candidate increase simulated insulin secretion without reducing cell viability? The cells are illustrative, and today’s assay is synthetic.”

### 0:18–0:40 · Independent work, connected discussion
**Show:** OpenAI and Groq workspaces, a retrieved abstract, then the shared room and a Relay receipt.

> “OpenAI and Groq work in separate Freestyle VMs. Each develops its own report before seeing the other’s. Agent Relay delivers peer messages through its broker, so they can challenge each other. We can inspect their jobs, supplied abstracts and delivery records.”

### 0:40–1:12 · The human changes the direction
**Show:** Play a short scientist turn, then click **Speak / interrupt**.

> “You hear brief summaries while the full reasoning stays in chat. I can interrupt and redirect the research.”

**Say into the microphone:**

> “Prioritize viability controls. Do not interpret increased secretion as a benefit unless viability is preserved.”

**Action:** Finish recording, review the transcript, select **Share with both scientists**. Let one short response play if ready.

**If a response addresses the advice, say:**

> “Their next reply addresses my viability constraint. The original discussion and my intervention remain in the record.”

**If still pending, say instead:**

> “My guidance is queued for both scientists. The interface shows the pending work; I’ll move to the completed assay while they respond.”

### 1:12–1:40 · A concrete experiment
**Show:** The previously completed run, its protocol, group means and secretion–viability scatter.

> “Here is a previously completed run of this same case. I approved 10 micromolar Candidate A at 11 millimolar glucose: eight wells each for vehicle, candidate and positive control. These charts show simulated secretion and viability. The quality check includes an 80-percent group-average viability threshold.”

Do not quote numerical outcomes unless they match the visible selected run. A 120-minute chart is a generated trajectory, not 120 minutes of actual observation.

### 1:40–2:00 · The takeaway
**Show:** Scientific PR, both reviews and the preserved disagreement or evidence limitations.

> “Both scientists review the result, and the Scientific PR keeps their conclusions, evidence gaps and disagreements. This is not proof that a drug works. It is a working prototype for making AI-assisted research easier to inspect, challenge and direct—with the human retaining experiment approval.”

## Optional extension — 30–45 seconds

Use only when the demo slot permits more than two minutes.

**Show:** A selected well, its exact data table, CSV export, then the human-approved protocol version.

> “Every chart connects back to individual simulated wells. I can inspect exact measurements, compare experiment versions and export the data. The seed makes the simulation reproducible, and the approval is tied to the precise protocol version. Changing the research direction does not silently authorize a new experiment. Our next step is to connect validated assay models and real experimental data, then evaluate whether this workflow improves research decisions.”

## Brief project description

CureLab is a human-led research workspace where OpenAI and Groq scientists work independently in separate Freestyle VMs, exchange peer messages through Agent Relay, and review a human-approved synthetic β-cell assay. Researchers inspect papers and logs, hear concise spoken discussion summaries, and interrupt with reviewed voice guidance. Versioned protocols, result charts and a Scientific PR preserve evidence and disagreements. Current measurements are generated by a reproducible toy simulator; the prototype demonstrates research collaboration rather than validated drug discovery.

## Judging alignment

- **Real-time AI and track technology:** demonstrate a genuine human intervention, subsequent model replies and real Agent Relay delivery.
- **Originality:** independent research plus peer critique and preserved dissent.
- **Execution:** show the working voice interaction and a clearly identified completed assay.
- **UX:** concise speech, persistent human chat, foldable logs and inspectable charts.
- **Potential and impact:** auditable research collaboration; real-world research benefit remains to be evaluated.
