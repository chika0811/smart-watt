# ADR-001: Mobile Application Framework Selection (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
The NoskyTech Ecosystem requires a unified cross-platform mobile application supporting iOS and Android. The application must perform BLE LESC ECDH pairing, `Noise_XXpsk2` local Wi-Fi socket encryption, QR code scanning, local SQLite caching, and dynamic control rendering for smart devices.

## 2. Alternatives Evaluated
1. **React Native (Bare Workflow) [PROVISIONAL SELECTION]**: JavaScript/TypeScript engine with direct native C++/Obj-C/Java modules.
2. **Flutter (Dart)**: Skia-based rendering framework with native plugin ecosystem.
3. **Native iOS (Swift) & Android (Kotlin)**: Separate native codebases per mobile platform.

## 3. Selected Approach & Technical Reason
We provisionally select **React Native (Bare Workflow)**. This choice remains **Provisional**, subject to completing technical validation spikes for native BLE LESC, mDNS sockets, background execution, and offline SQLite synchronization.

## 4. Operational Consequences
- **Positive**: Single codebase for domain logic; mature native plugin ecosystem; high UI fluidity.
- **Negative**: Native build environments (XCode & Android Studio) must be configured manually for native C++ bridge modules.

## 5. Technical Validation Spike Plan (Phase 1G)
Before finalizing React Native as irreversible, Phase 1 includes validation spike Phase 1G covering:
1. Native C++ bridge execution for `Noise_XXpsk2_25519_AESGCM_SHA256` transport sockets.
2. Background BLE LE Secure Connections (LESC) scanning on iOS and Android.
3. Push notification wake-ups during deep OS sleep.
