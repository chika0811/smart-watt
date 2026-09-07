# SW-8CH-ESP32-V1 Hardware Identity Physical Test Protocol (Step 5)

## 1. Test Objective & Scope

Physically validate the ESP32-S3 Hardware Digital Signature (DS) peripheral and eFuse key block binding established in Phase 1B.

---

## 2. Test Execution Matrix (DS-01 to DS-06)

| Test ID | Test Scenario | Expected Hardware Result | Actual Measured Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DS-01** | RSA-3072 PSS Signature Generation | Firmware invokes `esp_ds_sign()` with eFuse HMAC block. Signature generated in $< 120\text{ms}$. | Pending USB JTAG bench connection | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **DS-02** | Signature Cloud Verification | Cloud Auth Server verifies RSA-3072 signature against registered public key certificate. | Pending cloud gateway connectivity | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **DS-03** | Private Key Hardware Isolation | Attempting flash dump or RAM read of eFuse BLOCK4 (HMAC key) returns `0x00000000` (Hardware Read Disabled). | Pending espefuse.py audit | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **DS-04** | Post-Reboot Signature Continuity | Device reboots; DS peripheral signs second challenge identically. | Pending bench reset test | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **DS-05** | Factory Reset Key Survival | Executing NVS erase (`esptool.py erase_flash`) leaves eFuse HMAC key block intact; identity survives. | Pending NVS erase bench test | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **DS-06** | Device ID Cryptographic Binding | Identity certificate CN matches assigned `device_id` (`sw-8ch-0001`). | Pending certificate audit | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 3. Physical Hardware Evidence Template

```text
[PHYSICAL TEST EVIDENCE LOG: STEP 5]
Date/Time         : YYYY-MM-DD HH:MM:SS UTC
Board Serial      : SW-8CH-V1-PROTO-001
ESP32-S3 Chip ID  : ESP32-S3FH4R8 (Revision v0.2)
ESP-IDF Version   : v5.2.1
eFuse Key Block   : BLOCK4 (HMAC_KEY), Read Protect Bit = 1, Write Protect Bit = 1
DS Signing Time   : --- ms
Signature Match   : --- (VERIFIED / FAILED)
Test Result       : HARDWARE-VALIDATION-PENDING
```
