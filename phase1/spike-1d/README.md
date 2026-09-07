# Phase 1D — BLE LESC OOB Provisioning Spike

## 1. Objective & Scope

This spike experimentally proves the **BLE LE Secure Connections (LESC) Out-of-Band (OOB)** provisioning primitive for ESP32-S3 devices.

It validates the complete bootstrap-to-permanent credential lifecycle: using a 256-bit physical QR setup secret via BLE LESC ECDH P-256 link encryption (with a derived 128-bit BLE OOB value) to securely transfer initial Wi-Fi credentials, timezone, and initial RTC timestamp, while deriving the long-term `lan_trust_credential`. It proves atomic dual-slot commit resilience against power loss, MITM protection, replay rejection, and post-provisioning QR secret invalidation.

---

## 2. Directory Structure

```text
phase1/spike-1d/
├── README.md
├── firmware/
│   ├── main/
│   │   ├── main.cpp
│   │   ├── ble_provisioning.h
│   │   ├── ble_provisioning.cpp
│   │   └── CMakeLists.txt
│   ├── sdkconfig.defaults
│   └── CMakeLists.txt
├── client/
│   └── ble_setup_client.js
└── tests/
    └── test_ble_provisioning_suite.js
```

---

## 3. Cryptographic Contract & Credential Architecture

### 3.1 QR Secret Contract & BLE OOB Derivation

```text
Physical QR Setup Secret (Master Bootstrap Credential)
        = 256-bit / 32-byte cryptographically random secret
        │
        ├── 256-bit Master Bootstrap Credential (Scanned from QR Sticker)
        │
        └── Derived 128-bit BLE OOB Link Pairing Value
                    │
                    └── Used for BLE LESC P-256 link pairing exchange
```

* **Physical QR Setup Secret**: 256-bit (32-byte) master credential.
* **BLE LESC OOB Pairing Value**: 128-bit (16-byte) value derived via HKDF/hash truncation from the 256-bit QR master secret for BLE link-layer pairing.
* **Key Derivation (KDF)**: HKDF-SHA256 derives 256-bit `lan_trust_credential` from 256-bit Master QR Secret + ECDH P-256 shared secret.
* **Dual-Layer Security**: BLE LESC ECDH P-256 Link Layer Encryption + Application-Layer AES-256-GCM AEAD Payload Encryption (prevents GATT proxying / relay attacks).

### 3.2 Provisioning Payload Structure (Zero Default Credentials in Firmware)

```text
provisioning_payload
├── home_id                      (16 bytes)
├── device_id                    (UUID v4 string)
├── wifi_ssid                    (Customer Wi-Fi Network Name)
├── wifi_password                (Customer WPA2/WPA3 Passphrase)
├── timezone                     (IANA Timezone string, e.g., "Africa/Lagos")
├── rtc_timestamp                (Unix timestamp for RTC initialization)
└── lan_trust_credential         (Derived 256-bit LAN Trust Secret)
```

---

## 4. RTC & Offline Automation Architecture

* **Provisioning Time Sync**: Provisioning establishes initial device time and timezone on the hardware RTC.
* **Offline Resilience**: When Internet access is unavailable, the hardware RTC continues operating local schedules without requiring cloud connectivity.
* **Typed Automation Rules**: Cypher / Cloud generates typed automation rules stored in device NVS rather than requiring continuous live AI execution loops.

---

## 5. Test Execution Environment Delineation Matrix

| Component / Layer | Validation Level | Environment |
| :--- | :--- | :--- |
| **Protocol / Cryptographic Logic** | Software Protocol & State Machine | Node.js Test Runner (`test_ble_provisioning_suite.js`) |
| **ESP-IDF Firmware Code Base** | C++ Logic & Struct Alignment | Host GCC Target Runner (`app_main` in `main.cpp`) |
| **NimBLE / Controller Integration** | Hardware Target Validation | Reserved for Phase 1G / Hardware Lab Bench |

---

## 6. Test Suite Coverage Matrix (`BLE-01` to `BLE-12`)

| Test ID | Security Requirement | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `BLE-01` | LESC P-256 Pairing | LESC ECDH P-256 pairing succeeds | **PASS** |
| `BLE-02` | Valid OOB Secret Authentication | Pairing with derived 128-bit BLE OOB secret succeeds | **PASS** |
| `BLE-03` | Invalid OOB Secret Rejection | Pairing with incorrect derived OOB secret fails (`OOB_AUTH_FAILED`) | **PASS** |
| `BLE-04` | MITM Protection | LESC OOB provides authenticated MITM resistance | **PASS** |
| `BLE-05` | Unpaired Access Prevention | Read/Write on GATT characteristics before pairing denied | **PASS** |
| `BLE-06` | Payload Encryption & Auth | Provisioning payload (Wi-Fi, Timezone, RTC) encrypted with AES-256-GCM | **PASS** |
| `BLE-07` | Trust Credential Derivation | HKDF-SHA256 derives 256-bit `lan_trust_credential` from 256-bit QR secret | **PASS** |
| `BLE-08` | QR Bootstrap Invalidation | Post-provisioning, 256-bit QR setup secret invalidated for LAN | **PASS** |
| `BLE-09` | Reboot Identity Persistence | Provisioned identity, Wi-Fi & Timezone persist post-reboot | **PASS** |
| `BLE-10` | Factory Reset Transition | Factory reset returns device to unassigned 256-bit QR state | **PASS** |
| `BLE-11` | Atomic Commit / Partial Recovery | Power loss during setup rolls back half-valid state | **PASS** |
| `BLE-12` | Replay Rejection | Replayed provisioning message rejected (`REPLAY_ERROR`) | **PASS** |

---

## 7. Execution Instructions

```bash
# Execute automated BLE LESC OOB provisioning test suite
node phase1/spike-1d/tests/test_ble_provisioning_suite.js
```
