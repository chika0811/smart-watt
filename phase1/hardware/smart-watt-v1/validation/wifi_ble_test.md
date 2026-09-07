# SW-8CH-ESP32-V1 BLE & Customer Wi-Fi Physical Test Protocol (Steps 6 & 7)

## 1. Zero Hardcoded Credential Mandate

> **CRITICAL PRODUCT REQUIREMENT**:
> The ESP32-S3 firmware contains **ZERO hardcoded customer Wi-Fi SSIDs or passwords**.
> All wireless credentials are entered by the customer into the mobile app, encrypted using LESC OOB, transferred over BLE GATT, and saved to secure MCU NVS.

---

## 2. Test Execution Matrix (BLE-01 to BLE-10 & Customer Wi-Fi)

| Test ID | Test Scenario | Target Hardware Criterion | Status |
| :--- | :--- | :--- | :--- |
| **BLE-01** | Unprovisioned Device Discovery | ESP32-S3 advertises unprovisioned BLE GATT service upon initial boot. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-02** | Physical QR Secret Scan | Mobile app scans physical 256-bit QR bootstrap secret from device chassis. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-03** | BLE LESC OOB Pairing | LESC ECDH channel established; OOB secret authenticated. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-04** | Invalid QR Secret Rejection | Handshake fails when incorrect 256-bit QR secret is supplied. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-05** | Unauthorized GATT Block | Unauthenticated BLE clients blocked from reading/writing provisioning GATT characteristics. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-06** | Customer Wi-Fi Provisioning | Customer enters custom SSID/password; credentials transferred encrypted and saved to NVS. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-07** | Reboot Credential Persistence| ESP32-S3 reboots and connects automatically to customer's AP using stored NVS credentials. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-08** | Factory Reset State Clearance| 10s button hold clears stored Wi-Fi credentials; device returns to unprovisioned state. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-09** | Reconfiguration Flow | User changes Wi-Fi password; new credentials replace old credentials atomically. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **BLE-10** | Invalid Credential Fallback | Entering invalid Wi-Fi password fails connection without destroying last known-good NVS config. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **WIFI-POL**| 30-Day Credential Policy | App displays optional 30-day security reminder; firmware **NEVER deletes working credentials**. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
