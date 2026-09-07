# NoskyTech Ecosystem — Communication & Transport Architecture (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & Tri-Modal Transport Architecture

The NoskyTech Ecosystem implements a **Tri-Modal Transport Engine**:
1. **Local Wi-Fi (LAN)**: Sub-50ms target latency using **Native `Noise_XXpsk2_25519_AESGCM_SHA256` Transport Encryption**.
2. **Cloud Gateway (MQTTS)**: Global remote messaging over TLS 1.3 MQTTS streams using **MQTT 5.0 Enhanced Authentication (SASL)** via RSA-3072 DS hardware challenges.
3. **Bluetooth LE (BLE)**: Nearby offline control utilizing **BLE LE Secure Connections (LESC) ECDH P-256 Pairing** and application-layer AES-256-GCM encrypted GATT characteristics.

---

## 2. LAN Discovery Route Hierarchy & Socket Handshake

Discovery is strictly decoupled from network transport execution:

```text
[ Discovery Route Hierarchy ]
  ├── 1. Primary: mDNS Service Announcement (`_noskytech._tcp.local.`)
  ├── 2. Secondary: Cached Local Endpoint (SQLite `last_known_ip`)
  ├── 3. Tertiary: Nearby BLE Setup & Beacon Announcement
  └── 4. Quaternary: Cloud Relay (MQTTS Stream via EMQX Broker)
        │
        ▼  (Target Route Selected)
[ Socket Reachability Verification ]
  ├── Direct TCP 8080 Handshake Succeeds -> Execute Native Noise_XXpsk2 Transport Session
  └── Direct TCP Unreachable (AP Isolation / Router Firewall) -> Fall back to Cloud Relay / BLE
```

---

## 3. NDP v1 Protocol Specification

### 3.1 Message Envelope Definition

```json
{
  "v": 1,
  "msg_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "corr_id": "110e8400-e29b-41d4-a716-446655440000",
  "dev_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "CMD",
  "ep": 2,
  "seq": 145,
  "payload": {
    "instance_id": "relay_3",
    "capability": "power",
    "desired_value": false,
    "ttl_seconds": 10
  }
}
```

| Frame Key | Data Type | Purpose & Description |
| :--- | :--- | :--- |
| `v` | integer | Protocol specification version (strictly `1`). |
| `msg_id` | string (UUIDv4) | Unique message identifier for network frame deduplication. |
| `corr_id` | string (UUIDv4) | Correlation ID linking dispatches to initiating user requests / automations. |
| `dev_id` | string (UUIDv4) | Target physical device UUID. |
| `type` | enum | Message type: `CMD`, `ACK`, `REPORT`, `EVENT`, `PING`, `OTA`, `REPORT_CAPABILITIES`. |
| `ep` | integer | Active device `epoch` counter (Boot Generation). |
| `seq` | integer | Monotonic `sequence` counter (State Version). |
| `payload` | object | Command parameters or reported endpoint state payload. |

---

## 4. Native `Noise_XXpsk2` Transport Encryption & Credential Lifecycle

### 4.1 Cryptographic Parameters & Credential Transition
- **Noise Protocol Pattern**: `Noise_XXpsk2_25519_AESGCM_SHA256`
- **DH Curve**: Curve25519 (256-bit ECDH).
- **Cipher**: AES-256-GCM (Handled natively by Noise Transport State).
- **Hash**: SHA-256.
- **Credential Lifecycle (Bootstrap to Long-Term Trust)**:
  - **Bootstrap Phase**: The physical QR code setup secret functions strictly as a temporary bootstrap credential during initial provisioning.
  - **Trust Transition**: Upon successful home claiming, a permanent replacement LAN trust credential (`lan_trust_credential`) is derived via HKDF-SHA256 and committed to MCU NVS.
  - **Operational Phase**: Standard LAN sessions introduce `lan_trust_credential` as `psk2`. The physical QR setup secret is invalidated for standard LAN operation.

### 4.2 BLE Transport Security Rationale
- **BLE Link Encryption (LESC ECDH P-256)**: Protects the raw Bluetooth radio link against physical wireless eavesdropping.
- **Application AEAD (AES-256-GCM)**: Encrypts NDP message payloads independently of the transport layer, ensuring end-to-end payload security when frames traverse multi-hop hub relays or alternative network paths.
