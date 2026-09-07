# ADR-006: Bluetooth LE (BLE) Security Architecture (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Bluetooth/BLE is required for nearby offline communication and zero-touch Wi-Fi onboarding of newly unboxed NoskyTech devices.

## 2. Alternatives Evaluated
1. **BLE LESC ECDH P-256 Pairing + Application AES-256-GCM [FINAL SELECTION]**: LE Secure Connections with OOB setup code pairing, persistent session keys, and application-layer AEAD framing.
2. **Legacy BLE Pairing (Just Works)**: Basic BLE pairing vulnerable to passive MITM eavesdropping.
3. **Classic Bluetooth (SPP)**: High power consumption, unsupported on modern BLE microcontrollers.

## 3. Selected Approach & Technical Reason
We select **BLE LESC ECDH P-256 Pairing with OOB Setup Codes and Application AES-256-GCM**. BLE link-layer encryption protects the physical wireless medium; application-layer AEAD protects NDP frames independently of underlying transport, ensuring uniform packet security when frames traverse multi-hop hub relays or alternative transport links.

## 4. Operational Consequences
- **Positive**: Cryptographically secure onboarding; immune to passive MITM eavesdropping; low power footprint; transport-independent payload security.
- **Negative**: Distance restricted to ~10 meters; throughput capped at ~20 KB/s.

## 5. Migration Consequences
GATT UUID schemas are fixed; encryption parameters are forward-compatible with BLE 5.4 specifications.
