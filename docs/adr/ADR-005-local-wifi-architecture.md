# ADR-005: Local Wi-Fi (LAN) Security Architecture (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Local network control must operate with target sub-50ms latency without relying on internet WAN connectivity. Local communications must be secure against local network eavesdropping and MITM attacks without triggering OS self-signed SSL certificate rejections.

## 2. Alternatives Evaluated
1. **Native `Noise_XXpsk2_25519_AESGCM_SHA256` Transport Encryption [FINAL SELECTION]**: Direct Noise protocol transport encryption using pre-shared setup PSK transitioning to permanent replacement LAN trust PSK.
2. **HMAC-SHA256 over HTTP (No Encryption)**: Signed HTTP REST (provides Integrity/Auth, but ZERO Confidentiality).
3. **Self-Signed HTTPS**: Standard TLS with self-signed device certificates.

## 3. Selected Approach & Technical Reason
We select **Native `Noise_XXpsk2_25519_AESGCM_SHA256` Transport Encryption**. Noise transport encryption guarantees **Confidentiality, Integrity AND Authentication** on local Wi-Fi networks using standard Noise frame counters without redundant custom AES-GCM layers or SSL certificate overrides. The QR setup secret acts as a bootstrap credential that transitions to a permanent replacement LAN trust PSK.

## 4. Operational Consequences
- **Positive**: Sub-50ms target local control; operates completely offline; immune to local packet sniffing and tampering.
- **Negative**: Mobile app must implement Noise protocol transport framing in TypeScript/Native layer.

## 5. Migration Consequences
Cipher suites conform directly to the Noise Protocol Framework specification.
