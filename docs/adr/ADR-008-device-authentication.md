# ADR-008: Cloud Device Authentication Architecture (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Hardware devices must authenticate securely to the Cloud Gateway. Authentication mechanisms must protect MQTT broker infrastructure against Denial-of-Service (DoS) CPU exhaustion attacks during mass reconnection storms.

## 2. Alternatives Evaluated
1. **MQTT 5.0 SASL Enhanced Authentication Hook / Hardware Asymmetric Signing [FINAL SELECTION]**: Devices authenticate via MQTT 5.0 Enhanced Auth presenting hardware signatures (ESP32-S3 RSA-3072 DS); verifier checks signatures in memory using Redis public key caches.
2. **Argon2id Password Hash Lookup**: Broker evaluates Argon2id password hash on every MQTT `CONNECT` packet.
3. **X.509 Mutual TLS (mTLS)**: Per-device X.509 client certificate authentication.

## 3. Selected Approach & Technical Reason
We select **MQTT 5.0 SASL Enhanced Authentication Hook with Hardware Asymmetric Signing**. EMQX broker nodes validate device hardware signatures in memory using Redis caches with **zero PostgreSQL queries on the MQTT connection path**, completely eliminating database pool exhaustion during mass reconnect storms.

## 4. Operational Consequences
- **Positive**: Zero database bottleneck on connection path during reconnect storms; high cryptographic strength; stateless validation.
- **Negative**: Requires ESP-IDF Digital Signature API evaluation during Phase 1B hardware spike.

## 5. Migration Consequences
Conforms to native MQTT 5.0 SASL / Enhanced Authentication specification.
