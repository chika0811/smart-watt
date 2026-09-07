# ADR-007: Cloud Device Messaging Protocol (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
A bi-directional cloud protocol is required to connect devices to the NoskyTech Cloud Platform. The protocol must maintain low bandwidth, handle intermittent connections, support pub/sub subscriptions, and scale to 1,000,000+ nodes.

## 2. Alternatives Evaluated
1. **MQTT 5.0 over TLS 1.3 [FINAL SELECTION]**: Standard IoT pub/sub protocol over encrypted TLS sockets.
2. **WebSockets (WSS) for Hardware**: Custom WebSocket framing protocol.
3. **HTTPS Polling**: Polling REST endpoints at periodic intervals.

## 3. Selected Approach & Technical Reason
We select **MQTT 5.0 over TLS 1.3**. MQTT 5.0 is the industry standard for IoT hardware connectivity, providing low header overhead (2 bytes per packet), native topic hierarchies, QoS 1 delivery tracking, and Last Will and Testament (LWT) for instant offline detection.

## 4. Operational Consequences
- **Positive**: Low memory/bandwidth usage; built-in QoS 1 delivery; instant offline detection.
- **Negative**: Requires maintaining persistent TCP connections via 60s ping heartbeats.

## 5. Migration Consequences
Broker-agnostic protocol; compatible with EMQX, VernEMQ, or HiveMQ clusters.
