# ADR-004: Universal Device Protocol Specification (NDP v1) (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Hardware devices require a uniform bi-directional framing protocol over Cloud MQTT, Local Wi-Fi, and BLE. The protocol must enforce state version tuple ordering `(epoch, sequence)`, command tracking (`command_id`, `correlation_id`), capability negotiation, heartbeats, and ACKs.

## 2. Alternatives Evaluated
1. **NDP v1 (JSON / CBOR) [FINAL SELECTION]**: Dual-format framing (human-readable JSON for LAN/Cloud; compact CBOR binary for BLE).
2. **Protocol Buffers (Protobuf)**: Compiled binary serialization format.
3. **Raw C Struct Binary Buffers**: Native byte alignment buffers.

## 3. Selected Approach & Technical Reason
We select **NDP v1 (JSON / CBOR)**. Dual-format framing provides human-readable JSON for rapid debugging over LAN and Cloud, while allowing compact CBOR binary encoding for bandwidth-constrained BLE channels.

## 4. Operational Consequences
- **Positive**: Strict frame contract (`v`, `msg_id`, `corr_id`, `ep`, `seq`, `type`, `payload`); human-readable in debug mode; forward-compatible protocol versioning.
- **Negative**: ESP32 C++ firmware must use pre-allocated static cJSON pools to prevent heap fragmentation.

## 5. Migration Consequences
`v` field explicitly reserves versioning for future NDP v2 protocol upgrades.
