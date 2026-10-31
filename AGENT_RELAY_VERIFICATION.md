# Agent Relay integration verification

Verified on **2026-10-31 at 19:54:41 UTC**, against the official **Agent Relay 7.1.1** broker running in a separate Freestyle VM.

| Direction | Broker event ID | Recipient queue read |
| --- | --- | --- |
| OpenAI → Groq | `http_0c2acb57b7654903ab5c11f29bee5bbb` | Confirmed |
| Groq → OpenAI | `http_e45d0f142cd54a92896db6ba278d7edd` | Confirmed |

Verification mission: `T2D-5b3c84f5`. Each message traversed the public HTTPS broker endpoint, authenticated `/api/send`, and the recipient's `/pending` queue. The adapter checked sender, recipient, mission, job ID, source message ID and content before returning the received payload. An unauthenticated request to `/api/spawned` returned HTTP 401.

This verifies the **real message transport**, using connectivity messages rather than scientific output. It is not a full two-model research mission, biological result, direct VM-to-VM socket, or browser QA result. Separate earlier checks verified OpenAI and Groq calls inside their respective Freestyle VMs. The orchestrator now uses this same Relay adapter before dispatching critique and discussion jobs to those VMs.

Broker mailbox processes are `/bin/cat` transport harnesses. They do not run or impersonate the models. Model execution remains in the individual scientist VMs. Relaycast worker pre-registration emitted a transport warning during setup; local broker HTTP routing and both recipient queues worked. Hosted cross-broker Relaycast delivery is not claimed or required by this bridge.

Reproduce with `node --env-file=.env scripts/verify-relay.mjs`. This creates two mission-scoped broker mailbox processes and writes sanitized receipts to `data/relay-verification.json`. Keep that file separate from current live health: it is timestamped historical evidence. The app exposes it in connection settings.

The broker's mailbox queue is volatile and bounded. SQLite retains durable tasks and source messages; retries may resend after broker restart. Distributed exactly-once delivery and a transactional vendor outbox are future work.
