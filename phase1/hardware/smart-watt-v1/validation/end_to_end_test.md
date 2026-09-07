# SW-8CH-ESP32-V1 Master End-to-End System Test Protocol (Step 13)

## 1. Test Objective & Overview

Validate the complete 21-step end-to-end lifecycle of the Smart Watt SW-8CH-ESP32-V1 device from physical QR code setup to offline autonomy and cloud telemetry synchronization.

---

## 2. 21-Step Master Physical Execution Workflow

| Step # | Milestone Task | Verification Criterion | Status |
| :--- | :--- | :--- | :--- |
| **01** | Unbox & First Power | Unprovisioned BLE advertisement detected. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **02** | Scan Physical QR | 256-bit QR secret scanned from chassis. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **03** | BLE LESC OOB Handshake | Encrypted GATT session established. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **04** | Customer Wi-Fi Entry | Customer enters SSID/Password via app. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **05** | Hardware Identity Audit | `esp_ds_sign` RSA-3072 signature verified by cloud. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **06** | Home & LAN Trust Setup | `lan_trust_credential` committed to NVS. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **07** | Wi-Fi AP Connection | ESP32-S3 obtains DHCP IP on customer router. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **08** | Noise LAN Handshake | Local mobile app connects via Noise_XX. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **09** | MQTT 5 SASL Auth | Cloud EMQX broker authenticates device signature. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **10** | Telemetry Ingestion | Telemetry published to MQTT topic; `seq` unchanged. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **11** | Cypher Intent Parsing | Cypher translates "Turn bulb ON at 7 AM" to JSON. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **12** | NVS Rule Persistence | Rule committed to double-buffered Slot A NVS. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **13** | RTC Schedule Eval | PCF8563 RTC triggers scheduled event. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **14** | Relay Actuation | Relay 1 toggles ON; **`sequence += 1`**. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **15** | Metrology Ingestion | ADE7953 V, I, P, S, PF, E sampled correctly. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **16** | Presence Automation | LD2410B presence triggers local rule. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **17** | Sever Internet | Customer router WAN cable unplugged. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **18** | Offline Autonomy | Relays, RTC, & presence rules continue 100% offline. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **19** | Restore Internet | Customer router WAN cable reconnected. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **20** | Telemetry Sync | Buffered telemetry flushed to cloud post-reconnect. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **21** | Final State Audit | Version sequence & NVS state verified consistent. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
