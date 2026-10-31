# Implementation versus original design

## Implemented and tested locally

- Persistent missions and separate OpenAI / Anthropic OS processes.
- Independent initial-report barrier; committed reports then peer critiques.
- Durable shared message history, PI messages to both workers, independent result reviews.
- Server-side live provider request adapters, explicit account-specific model configuration, request IDs, bounded responses, timeout/error handling. Live requests are **not tested** yet.
- Human approval tied to an immutable version and protocol SHA-256.
- Reproducible seeded assay with vehicle, candidate, positive control, replicate measurements, synthetic time course, viability and control QC.
- Idempotent run commands; a scientist crash does not terminate the assay.
- Restoring active runs from saved checkpoints after backend restart.
- Content-addressed JSON artifacts and provenance; every simulated result labeled.
- Scientific PR, preserved dissent, acceptance/replication decisions, research bundle export.
- Responsive dark research dashboard, selectable procedural 3D cells, orbit/zoom, single-cell view, conceptual signaling, protocol controls, charts, plate, audit and connection status.

## Architecture adjustments for the requested local build

React + Vite and an Express BFF replace Next.js. SQLite stores authoritative local state; IPC transports work and results. Each snapshot and audit event commits in one SQLite transaction. A single orchestrator owns the database and child-process registry. Persisted queued jobs reconcile on restart. IPC child identity fences messages from stopped workers. A run command ID can commit only one run in an experiment.

This is a single-process local orchestrator, not a distributed lease coordinator. The app does not claim Terse persistence or Agent Relay transport. The original specs are preserved unchanged.

## Remaining integration work

1. **Terse Durable Actors.** Create the official actor project with the CLI, implement MissionActor / ExperimentActor transitions, generate the typed client, migrate authoritative state to those actors, and test worker restart against the real runtime. Official reference: https://docs.useterse.ai/quickstart . The API uses `terse-sdk/actor`, `@Persisted`, and generated clients; no guessed HTTP facade has been substituted.
2. **Agent Relay.** Install/pin the broker and SDK, connect both provider workers to a mission channel, implement acknowledged inbox cursors and a transactional outbox bridge, then verify genuine cross-provider message delivery. Official reference: https://agentrelay.com/docs/typescript-sdk . The current SQLite message log is not this broker.
3. **Observed-data research.** Fetch/version a permitted GEO dataset, preserve donor metadata, run a donor-aware computational analysis, and connect a bounded ChEMBL evidence tool. Source links alone are not evidence or reanalysis. No quantitative claims about those datasets are implemented.
4. **Live provider verification.** Supply both keys and model names; inspect real provider IDs and scientific output. Default demo messages remain explicitly scripted.
5. **Browser QA.** Verify desktop/mobile layout, WebGL availability, keyboard behavior, controls, and the full HTTP workflow on an unrestricted local machine. Production compilation succeeded; the current sandbox denied listening sockets and its browser runtime failed before connecting.
6. **Production operation.** Multi-user authentication/RBAC, tenant isolation, rate/budget enforcement, deployment storage, distributed fencing and outbox recovery are outside the local demo implementation.

## Scientific model

Synthetic candidate effect is `dose / (dose + 5)`. Glucose influence is `glucose / (glucose + 7)`. Seeded Gaussian variation generates replicate wells. Viability declines by an assumed linear dose term. These are explicit toy assumptions, not fitted pharmacology. The visual geometry and cell interactions are illustrative. No cell-interaction probability estimator, treatment recommendation, cure claim, or clinical efficacy estimate is supplied.

## Subsequent update: Freestyle and reading/activity desk

Freestyle v5 runtime adapter and per-agent observability are now implemented. Europe PMC abstract retrieval runs during live initial investigations, with source hashes and retrieval/context-supply statuses. GEO/ChEMBL quantitative analysis is still not implemented. The initial Freestyle signup-risk block was lifted. Both real VMs were created, both provider connectivity calls succeeded inside their respective VMs, and Europe PMC abstract retrieval succeeded inside each VM. The full browser-driven remote research workflow still needs visual QA. See README for runtime configuration, retention and verification details.
