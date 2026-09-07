# ADR-010: Offline-First Architecture & Device Logical Version (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Mobile app users require instant UI rendering and local control when offline. Reconnecting devices must reconcile state without executing stale queued commands that override manual physical switch toggles ("Ghost Actuation").

## 2. Alternatives Evaluated
1. **Device Logical Version `(epoch, sequence)` [FINAL SELECTION]**: Lexicographically ordered version tuple where manual physical switch toggles increment `sequence` locally on state transitions.
2. **Arbitrary "+1000" Sequence Jump Offset**: Ad-hoc sequence jumping hack.
3. **CRDTs (State-based Vector Clocks)**: Full CRDT vector clock engine.

## 3. Selected Approach & Technical Reason
We select **Device Logical Version `(epoch, sequence)`**. The formal version tuple $V = (\text{epoch}, \text{sequence})$ mathematically guarantees wall-clock independent ordering across LAN, Cloud, and BLE, ensuring manual physical switch toggles retain absolute precedence over stale queued cloud commands without arbitrary offset hacks. Sequence numbers increment strictly on state transitions; telemetry observations reuse active versions and update observation timestamps separately.

## 4. Operational Consequences
- **Positive**: Ghost command actuation eliminated; clock-independent offline reconciliation; minimal MCU RAM footprint; durable persistence invariant; clean state transition vs observation separation.
- **Negative**: Requires storing version tuple fields in database state tables.

## 5. Migration Consequences
`epoch` and `sequence` fields are standard integer types stored in PostgreSQL state records.
