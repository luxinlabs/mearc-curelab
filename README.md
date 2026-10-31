# mearc-curelab

A local research laboratory for two independent scientist workers, an interactive 3D pancreatic islet, and reproducible virtual experiments.

## Run

Requires **Node.js 24+** (uses built-in `node:sqlite`). Dependencies are already installed in this workspace.

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. For a production build:

```sh
npm run build
npm start
```

The server binds only to `127.0.0.1`. `PORT` defaults to 3000. Do not expose this local single-user prototype to a public network. State lives in `data/curelab.sqlite`; content-addressed result artifacts live in `data/artifacts/`. Set `CURELAB_DATA_DIR` to move storage. Restarting preserves committed missions, protocol approvals, jobs, messages, checkpoints, and results.

## Demo flow

1. **Start investigation.** OpenAI and Groq run in separate Node processes. Each first-pass report is private until both are committed. In explicitly selected demo mode these reports are explicitly scripted, not AI-generated.
2. Inspect both proposals and their cross-critiques in the **Research room**. Send a note to both scientists after the independence barrier opens.
3. Explore the **3D islet**, **Single cell**, and **Signaling** tabs. Drag to orbit, scroll to zoom, click a cell, select a cell type using the accessible legend, pause animation, or toggle transparent membranes. This is procedural illustrative geometry, not reconstructed tissue or a predictive biological model.
4. Review or revise the protocol. **Approve the exact version**, then **Run experiment**. Glucose, dose, seed, and replicate count affect the synthetic output. Changing the visual preview does not silently mutate an approved protocol; save a new version in the protocol dialog.
5. During an assay, press **Stop worker** for OpenAI. This sends SIGKILL to the actual scientist process; the experiment worker is independent. Groq continues its review. **Resume worker** starts a new process and processes pending evidence.
6. Inspect the assay plate, simulated response curves, viability QC, control variation, and SHA-256 artifact. Repeating the same run command ID returns the existing run. Create a new approved protocol version to repeat an assay.
7. Once both scientists review the result, **Create Scientific PR**. It retains critiques and limitations. Accept the research record or request replication; export the full research bundle and audit trail as JSON.

## Connect real providers

Copy `.env.example` to `.env`, set `CURELAB_MODE=live`, and supply **both** provider API keys and explicit model names available to your accounts:

```dotenv
CURELAB_MODE=live
OPENAI_API_KEY=...
OPENAI_MODEL=...
GROQ_API_KEY=...
GROQ_MODEL=...
```

Restart the server and create a new mission. Set CURELAB_MODE=demo explicitly to use scripted examples. No provider calls are made in demo mode, even if an API key is already in the environment. Live mode refuses to start a mission unless both providers and model names are configured. Provider errors appear in the research room and do not silently fall back to scripted messages. Resume retries a failed job. Response request IDs and model names are retained. API keys remain server-side.

OpenAI uses the [Responses endpoint](https://developers.openai.com/api/reference/resources/responses/methods/create); Groq uses [OpenAI-compatible chat completions](https://console.groq.com/docs/openai). Each process receives its own initial context; peer proposals are supplied only for cross-review. The application makes a bounded initial investigation, cross-review, and result-review call per scientist, plus one call per PI note. Actual provider execution has not been verified without configured credentials.

## Scientific and integration scope

- The executable scientific pipeline is **a deterministic synthetic assay**, not a public-data reanalysis or physical wet-lab experiment. Its assumptions are encoded explicitly in `server/simulator.mjs`. A positive result validates software behavior, not a candidate therapy.
- Source cards link to GSE81608, GSE41762, and ChEMBL as **proposed sources**. No datasets have been downloaded or analyzed. They are not falsely labeled as evidence-backed findings.
- Charts show model-generated temporal curves. Approximate intervals describe synthetic replicate noise; they are not biological confidence estimates. The cell-signaling network does not provide inferred probabilities.
- **Agent Relay** routes peer context when `CURELAB_TRANSPORT=agent-relay`; configure its URL and API key separately. **Terse is not connected.** SQLite remains authoritative. See the Relay setup below and system design §0.
- Local human control uses a per-server session token and same-origin mutation checks. This is not multi-user authentication or production RBAC.
- A replication request is persisted as a review decision; it does not automatically execute another experiment. Create and approve a new protocol to run the next iteration.

## Validation

```sh
npm test
npm run build
```

The tests cover deterministic output, changed inputs, QC failure, exact-version approval, command idempotency, content hashes, independent-first-pass privacy, actual process kill/restart, continuation while one scientist is offline, both result reviews, PR generation, and restoration of an active run after orchestrator restart.

In the implementation environment the production build and worker/workflow tests passed. A listening preview server was denied by sandbox networking, and the browser tool failed to initialize; visual browser QA and real provider calls remain unverified.

## Structure

- `src/App.jsx`: mission, research room, protocol editor/reviewer, assay results, evidence, PR and audit UI.
- `src/CellScene.jsx`: procedural Three.js cell models, selection, orbit controls and illustrative signal particles.
- `server/lab.mjs`: durable orchestration, independent barrier, worker lifecycle, immutable approval, run idempotency and reviews.
- `server/store.mjs`: SQLite snapshots and transactional append-only audit records.
- `server/agent-worker.mjs`: separate OpenAI / Groq provider adapters and explicit demo behavior.
- `server/experiment-worker.mjs`: independently executing, checkpointed simulation worker.
- `server/simulator.mjs`: seeded synthetic measurements, curves, summaries and QC.
- `server/app.mjs`: local API, session authorization and SSE.
- `server/index.mjs`: application startup and frontend server.

## Research desk and provider update

New missions use OpenAI + Groq. Existing missions retain their historical providers (as read-only historical records). Configure GROQ_API_KEY and GROQ_MODEL, restart, and create a new mission to use Groq.

The human research desk starts a mission from a question, sends follow-up requests to both scientists after the independence barrier, and extracts explicitly stated dose/glucose/well/seed values into the reviewable protocol form. It is a deterministic parameter helper, not an LLM planner. Responses appear in the desk and full research room. No chat message bypasses experiment approval.

The execution trace displays real persisted job phases, statuses, completed task counts, process IDs, and the current sharing barrier. Task transport is Freestyle exec or local IPC. Peer critique/discussion context crosses the official Agent Relay broker when enabled, with receipt logs and no silent local fallback.

## OpenEvidence access review — October 31, 2026

The official enterprise page (https://portal.openevidence.com/) documents institutional integration and limits eligibility to patient-care organizations supporting verified U.S. clinicians. A public developer authentication/endpoint contract could not be verified. The apparent API policy URL returned HTTP 403. No unofficial scraper or invented API was added.

For now, a researcher can use their authorized OpenEvidence access separately and share original paper identifiers/citations with the scientists through the research desk. Those references still require independent verification and do not become observed measurements. Programmatic access requires confirming an approved integration with OpenEvidence; the product currently has no OpenEvidence connector.

## Live chat correction

The project `.env` now selects live mode. Startup explicitly loads the project provider settings so inherited shell keys do not override the keys configured for CureLab. Demo replies are used only when `CURELAB_MODE=demo` is explicitly selected. Active providers are OpenAI and Groq; Anthropic execution was removed. Historical missions with other providers are not resumed; startup creates a current-provider mission when the latest saved mission uses legacy providers. Historical message authors remain unchanged.

The chat header displays runtime mode and configured models. The parameter-draft helper is still deterministic, but scientist chat replies in live mode are generated by provider APIs. Provider adapter tests verify endpoint, key/model routing, human input, and no fallback after errors using mocked HTTP responses. These are not live account/credit checks. Restart the backend after changing configuration.

## Freestyle agent VMs and observability

Set `CURELAB_RUNTIME=freestyle` and `FREESTYLE_API_KEY` in `.env`. Each mission/provider gets a dedicated VM slug (`curelab-<mission>-openai` and `curelab-<mission>-groq`). The adapter uses the documented Freestyle v5 REST API. It reuses matching slugs, configures outbound network access without inbound public services, installs Node.js if needed, and uploads only trusted worker code. Only the relevant model provider key is passed to each VM through the execution environment; the Freestyle master key stays in the orchestrator. VMs have a 600-second idle pause setting. Stop requests pause the VM; no destructive delete operation is used.

Agent jobs execute inside their respective VMs. The local orchestrator polls structured JSONL task events every 1.5 seconds and streams committed updates to the frontend. Persisted remote cursors and per-job file locks reconcile completed jobs after restarts. An interrupted, incomplete provider call may need a retry; exactly-once provider billing is not guaranteed. VMs persist independently of the browser. Check the Freestyle dashboard for compute state and billing; a failed pause is explicitly reported.

The Agent Observatory shows per-agent runtime identity, job events, model request/response IDs, failures, and literature retrieval. It shows the latest 300 mission activity events; the full persisted audit is included in research export. These are observable task/tool events, not hidden model reasoning or an interactive general-purpose shell terminal.

In live proposal generation, each scientist searches Europe PMC for up to three paper records and supplies available abstracts to its model. The reading desk records title, authors, year, source URL, abstract SHA-256 and status. Metadata-only, retrieved abstract and abstract supplied to model are distinct. No full-text reading or scientific validation is claimed. Retrieval failures remain visible and do not fabricate sources. Demo mode does not fetch papers.

**Verification status:** The initial Freestyle signup-risk restriction was subsequently lifted. Two real VMs were created for mission T2D-36e63410. Trusted workers executed successfully in each VM; OpenAI `gpt-5.4` and Groq `openai/gpt-oss-120b` both returned real provider responses with request IDs. Each VM also retrieved three Europe PMC abstracts in a separate literature-tool check. These were connectivity/tool checks, not scientific investigations. The sanitized verification record is stored in `data/runtime-verification.json` and displayed in the observatory with its timestamp. The full browser-driven research workflow on the remote runtime remains to be visually verified.

VMs are retained with a 600-second idle pause policy. The runtime will reuse them by slug for this mission; other missions provision separate VMs. Set `CURELAB_RUNTIME=local` explicitly to return to local workers.

References: https://www.freestyle.sh/docs/vms and https://api.freestyle.sh/openapi.json .

## Separate workspaces and shared conversation

The shared discussion excludes independent proposals and result reports; those are shown inside each agent's expandable workspace. Each workspace, VM/job section, report, log section and paper desk can be folded independently. Basic Markdown formatting is rendered as safe React elements, never raw HTML.

After independently committing proposals, each scientist sends a peer-addressed critique. Both then receive the other scientist's specific critique and send a reply referencing its message ID. Only after that bounded exchange is the initial protocol presented for approval. “Continue agent discussion” requests one additional exchange using the latest peer message, without executing experiments. Duplicate pending rounds are rejected. The local orchestrator routes these messages between the separate Freestyle workers; the shared UI is not a third model or an additional VM. Existing report authors and content are preserved. Restart the backend to upload the updated worker code when VMs reconnect.


## Agent Relay track

Peer messages use the official Agent Relay **7.1.1** broker HTTP API. OpenAI and Groq retain separate compute VMs; the orchestrator bridges their mission-scoped broker mailboxes. Broker queue receipts are visible on replies and in each agent's expandable logs. A receipt on a reply describes its **incoming peer context**.

On a dedicated Node host, install `agent-relay@7.1.1` globally, copy `scripts/relay-host.mjs`, and run it from a persistent private working directory. The script resolves the bundled SDK, creates/reuses its Relaycast workspace, starts the authenticated broker on port 3888 and renews its lease. Keep this process supervised. Publish port 3888 through HTTPS (Freestyle TLS ingress is supported).

Copy the broker access token from the host's `.agent-relay/connection.json` `api_key` into the application's `.env` as `RELAY_BROKER_API_KEY`; set `RELAY_BROKER_URL` and `CURELAB_TRANSPORT=agent-relay`, then restart CureLab. Never commit either credential file. A full SDK restart generates a new broker token; update `.env` then. VM pause/resume preserves a running process. Provider keys are not required on the broker VM.

Start a mission and inspect `RELAY_SEND` → `RELAY_RECEIVED` → `RELAY_DELIVERY_CONFIRMED`. Independent drafts are never shared before both finish. An unavailable broker fails the peer job; Resume retries it. Human notes and independent result reviews still use normal task transport. `CURELAB_TRANSPORT=local` explicitly selects offline/local messaging and must not be presented as Relay evidence.

The pending queue is volatile and bounded to 256 messages per mailbox. Retries check job IDs before sending, but a broker restart can cause a resend; no exactly-once or distributed-outbox guarantee is claimed. This is a single-orchestrator prototype. The relay adapter validates identities and payloads before passing received text to the scientist VM.

Real bidirectional broker verification and its limits are recorded in [AGENT_RELAY_VERIFICATION.md](AGENT_RELAY_VERIFICATION.md). Run `node --env-file=.env scripts/verify-relay.mjs` to repeat it from a network-enabled local machine; sanitized receipts are saved under ignored `data/`. Restart the local app after changing `.env`. Existing missions retain their selected transport; start a new mission to select Relay after running a local-mode mission.


## Voice research roundtable

Every mission includes a voice panel. Enter a **specific task** (or record and review one), then assign it to the scientists. Click **Listen to discussion** to hear new critiques, replies and discussion turns in two distinct OpenAI synthetic voices. **Discuss for 3 more rounds** requests a bounded continuation; it never runs an experiment.

Click **Speak / interrupt** to stop narration and record your suggestion. The microphone closes after **Finish speaking** or 45 seconds. Review/edit the transcription and select **Share with both scientists**. Both agents receive priority reply tasks and subsequent turns include your advice. **Resume without a note** releases the discussion pause. During independent discovery, recording drafts advice without pausing the independent-report barrier.

This is click-to-interrupt, turn-based audio. It is not hands-free VAD/full-duplex speech. Existing model calls may finish while new turns are paused. Their earlier guidance revision stays in the audit record; stale turns are not automatically spoken. Speech is buffered before playback, so provider latency is visible. Switching missions stops local audio and the microphone; a durable discussion pause must be resumed when returning.

Configuration (already added to `.env.example`; use the existing OpenAI key):

```dotenv
CURELAB_VOICE=true
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TRANSCRIBE_MODEL=gpt-transcribe
OPENAI_SCIENTIST_VOICE=nova
GROQ_SCIENTIST_VOICE=onyx
```

Voice APIs are disabled in demo mode. Keys stay on the server; recorded audio is not saved to disk. Use localhost or HTTPS for microphone access. Text task entry and chat continue to work without voice.

**Audio model lifecycle:** OpenAI has scheduled the Speech API TTS models to retire on January 6, 2027. This verified hackathon implementation uses that still-supported endpoint. Migrate synthesis to the Realtime API before that date; `gpt-realtime-2.1-mini` cannot be substituted into `/audio/speech`. See [official speech documentation](https://developers.openai.com/api/docs/guides/text-to-speech).

Voice playback is unlocked on the Listen/Test voice click before the synthesis request begins, avoiding delayed autoplay blocking. Use each scientist’s **Test voice** button to check output without starting research. The selected mapping is OpenAI → `nova` (feminine-sounding), Groq → `onyx` (masculine-sounding). Restart the backend after changing voice configuration, then refresh the page.


## Experiment result charts

The Laboratory and Experiments pages now include a result explorer alongside the existing time-course chart. Switch between group means (stored secretion uncertainty intervals), well distributions (quartiles and all observations), secretion-versus-viability scatter, and a full-well heatmap. Select an earlier experiment version, click a point or heatmap tile for exact measurements, or open the accessible data table. Download the selected SVG chart or all wells as CSV. Every view is explicitly simulated; the 80% scatter reference is distinct from the group-mean viability QC rule. No dose-response series is inferred from a single-dose experiment.

Discussion-audio controls now show AUDIO ON/OFF or DISCUSSION PAUSED explicitly. A successful Test voice enables listening, and changing missions retains the unlocked audio output and listening preference while stopping old playback and microphone capture. When interrupted, choose **Resume discussion & listen** (or submit your reviewed note). Explicit Listen/Resume queues the latest eligible reply from each scientist, excluding independent drafts and outdated guidance.

## HTML showcase and judging demo

Open [the product showcase](http://localhost:3000/showcase.html) while the app is running, or use **Project showcase** in the workspace header. Source: `public/showcase.html`. The read-only page describes implemented features and integrations, plus a two-minute walkthrough mapped to the supplied Haunted Hacks judging criteria. Design follows the [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): clear hierarchy, responsive cards, keyboard focus, reduced motion and explicit integration status. New cell gesture controls and the broad workspace redesign are deferred.

Shared turns are now summarized into **one or two short spoken sentences**; full messages stay in chat and remain the scientists’ peer context. A separate OpenAI Responses call uses the configured `OPENAI_MODEL` to preserve the key point, next step and uncertainty. Summaries are length-validated, cached in a bounded server-memory cache and recorded with request IDs in the voice audit event. Failures are surfaced instead of falling back to lengthy narration. OpenAI keeps `nova`, Groq keeps `onyx`. Restart the backend and refresh the page to apply this change.
