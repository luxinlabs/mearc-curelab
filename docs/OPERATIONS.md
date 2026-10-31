# CureLab operations

[← Project overview](../README.md) · [System design](../CureLab_System_Design.md)

This guide covers live infrastructure, delivery guarantees and voice controls. For a credential-free preview, use the demo configuration in the README.

## Freestyle agent VMs and observability

Set `CURELAB_RUNTIME=freestyle` and `FREESTYLE_API_KEY` in `.env`. Each mission/provider gets a dedicated VM slug (`curelab-<mission>-openai` and `curelab-<mission>-groq`). The adapter uses the documented Freestyle v5 REST API. It reuses matching slugs, configures outbound network access without inbound public services, installs Node.js if needed, and uploads only trusted worker code. Only the relevant model provider key is passed to each VM through the execution environment; the Freestyle master key stays in the orchestrator. VMs have a 600-second idle pause setting. Stop requests pause the VM; no destructive delete operation is used.

Agent jobs execute inside their respective VMs. The local orchestrator polls structured JSONL task events every 1.5 seconds and streams committed updates to the frontend. Persisted remote cursors and per-job file locks reconcile completed jobs after restarts. An interrupted, incomplete provider call may need a retry; exactly-once provider billing is not guaranteed. VMs persist independently of the browser. Check the Freestyle dashboard for compute state and billing; a failed pause is explicitly reported.

The Agent Observatory shows per-agent runtime identity, job events, model request/response IDs, failures, and literature retrieval. It shows the latest 300 mission activity events; the full persisted audit is included in research export. These are observable task/tool events, not hidden model reasoning or an interactive general-purpose shell terminal.

In live proposal generation, each scientist searches Europe PMC for up to three paper records and supplies available abstracts to its model. The reading desk records title, authors, year, source URL, abstract SHA-256 and status. Metadata-only, retrieved abstract and abstract supplied to model are distinct. No full-text reading or scientific validation is claimed. Retrieval failures remain visible and do not fabricate sources. Demo mode does not fetch papers.

**Verification status:** The initial Freestyle signup-risk restriction was subsequently lifted. Two real VMs were created for mission T2D-36e63410. Trusted workers executed successfully in each VM; OpenAI `gpt-5.4` and Groq `openai/gpt-oss-120b` both returned real provider responses with request IDs. Each VM also retrieved three Europe PMC abstracts in a separate literature-tool check. These were connectivity/tool checks, not scientific investigations. The sanitized verification record is stored in `data/runtime-verification.json` and displayed in the observatory with its timestamp. The full browser-driven research workflow on the remote runtime remains to be visually verified.

VMs are retained with a 600-second idle pause policy. The runtime will reuse them by slug for this mission; other missions provision separate VMs. Set `CURELAB_RUNTIME=local` explicitly to return to local workers.

References: https://www.freestyle.sh/docs/vms and https://api.freestyle.sh/openapi.json .


## Agent Relay track

Peer messages use the official Agent Relay **7.1.1** broker HTTP API. OpenAI and Groq retain separate compute VMs; the orchestrator bridges their mission-scoped broker mailboxes. Broker queue receipts are visible on replies and in each agent's expandable logs. A receipt on a reply describes its **incoming peer context**.

On a dedicated Node host, install `agent-relay@7.1.1` globally, copy `scripts/relay-host.mjs`, and run it from a persistent private working directory. The script resolves the bundled SDK, creates/reuses its Relaycast workspace, starts the authenticated broker on port 3888 and renews its lease. Keep this process supervised. Publish port 3888 through HTTPS (Freestyle TLS ingress is supported).

Copy the broker access token from the host's `.agent-relay/connection.json` `api_key` into the application's `.env` as `RELAY_BROKER_API_KEY`; set `RELAY_BROKER_URL` and `CURELAB_TRANSPORT=agent-relay`, then restart CureLab. Never commit either credential file. A full SDK restart generates a new broker token; update `.env` then. VM pause/resume preserves a running process. Provider keys are not required on the broker VM.

Start a mission and inspect `RELAY_SEND` → `RELAY_RECEIVED` → `RELAY_DELIVERY_CONFIRMED`. Independent drafts are never shared before both finish. An unavailable broker fails the peer job; Resume retries it. Human notes and independent result reviews still use normal task transport. `CURELAB_TRANSPORT=local` explicitly selects offline/local messaging and must not be presented as Relay evidence.

The pending queue is volatile and bounded to 256 messages per mailbox. Retries check job IDs before sending, but a broker restart can cause a resend; no exactly-once or distributed-outbox guarantee is claimed. This is a single-orchestrator prototype. The relay adapter validates identities and payloads before passing received text to the scientist VM.

Real bidirectional broker verification and its limits are recorded in [AGENT_RELAY_VERIFICATION.md](../AGENT_RELAY_VERIFICATION.md). Run `node --env-file=.env scripts/verify-relay.mjs` to repeat it from a network-enabled local machine; sanitized receipts are saved under ignored `data/`. Restart the local app after changing `.env`. Existing missions retain their selected transport; start a new mission to select Relay after running a local-mode mission.



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

**Audio API compatibility:** This implementation uses `/audio/speech` for synthesis and `/audio/transcriptions` for human input. Consult the [official speech documentation](https://developers.openai.com/api/docs/guides/text-to-speech) for model availability and lifecycle notices before deploying. Moving to Realtime requires a new transport implementation; its model names cannot simply be substituted into the speech endpoint.

Voice playback is unlocked on the Listen/Test voice click before the synthesis request begins, avoiding delayed autoplay blocking. Use each scientist’s **Test voice** button to check output without starting research. The selected mapping is OpenAI → `nova` (feminine-sounding), Groq → `onyx` (masculine-sounding). Restart the backend after changing voice configuration, then refresh the page.



## Spoken summaries

Each shared turn is summarized into one or two short sentences with the configured `OPENAI_MODEL`, then spoken in the scientist’s assigned voice. Full messages remain in chat and peer context. The server validates brevity, caches up to 256 summaries and records the summary and request IDs in the audit. A summarization failure is shown instead of falling back to reading a long paragraph. Summary generation incurs a separate model call on a cache miss.

## Persistence and local access

The server binds to `127.0.0.1`; the default port is 3000. SQLite snapshots and audit records live in `data/curelab.sqlite`, with content-addressed results in `data/artifacts/`. Set `CURELAB_DATA_DIR` to relocate storage. The local PI token and same-origin mutation checks are not multi-user authentication.

An approval binds to an exact protocol version and hash. Repeating a run command ID returns the existing run. Create and approve a new protocol version to repeat an assay. Requesting replication records a review decision; it does not automatically execute another experiment.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Scripted responses | Confirm `CURELAB_MODE=live`, restart and create a new mission. |
| Provider error | Check both configured keys, model access and the displayed request error. No scripted fallback is used. |
| Peer exchange blocked | Check Relay URL/token, broker process and delivery events; resume the failed worker job. |
| Voice test works but discussion is silent | Click Listen; ensure the discussion is not paused and shared critique/reply turns exist. Independent proposals are silent. |
| Human interruption leaves the room paused | Submit the reviewed transcript or select Resume discussion & listen. |
| Old runtime or transport appears | Restart after configuration changes and create a new mission. Existing missions retain their transport. |

The visual cell controls do not change approved experiment parameters. Use the protocol editor and approve a new version.
