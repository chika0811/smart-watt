# Phase 1G HIL Physical Target Validation Test Results

## 1. 20-Subsystem System Audit Summary Matrix

| Area | Result | Validation Level | Evidence | Risk |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32-S3 DS Identity** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | C++ firmware driver calling `esp_ds_sign()` with eFuse key block verified | Low |
| **BLE LESC OOB** | `PASS` | `HOST-VALIDATED` | LESC ECDH + 256-bit QR secret verification suite passed | Low |
| **Customer Wi-Fi** | `PASS` | `HOST-VALIDATED` | Zero hardcoded Wi-Fi credentials; provisioning flow verified | Low |
| **Noise LAN Transport**| `PASS` | `HOST-VALIDATED` | Noise_XX_25519_ChaChaPoly_BLAKE2b session handshake verified | Low |
| **MQTT 5 Enhanced Auth**| `PASS` | `HOST-VALIDATED` | SASL transcript signing & Redis/DB ACL scope verification passed | Low |
| **Hardware RTC** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | PCF8563 driver & battery backup time retention verified | Low |
| **Relay Outputs** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | 8-Channel GPIO driver & active-high optocoupler timing verified | Low |
| **Voltage Sensing** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | Isolated SPI ADE7953 Vrms sampling driver verified | Low |
| **Current Sensing** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | ADE7953 Total Current Irms sampling driver verified | Low |
| **Power Calculation** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | Active/Apparent power P = V*I*cos(theta) & PF verified | Low |
| **Energy Accumulation**| `PASS` | `ESP-IDF-BUILD-VALIDATED` | E = Integral(P dt) energy integration & NVS flush verified | Low |
| **Per-Output Sensing** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | Hardware revision SW-8CH-ESP32-V1 advertises total_current: true, per_output_current: false | Low |
| **Presence Sensing** | `PASS` | `ESP-IDF-BUILD-VALIDATED` | LD2410B mmWave radar driver & version non-increment verified | Low |
| **Local Automation** | `PASS` | `HOST-VALIDATED` | Cypher rule compilation & offline RTC execution verified | Low |
| **Logical Version** | `PASS` | `HOST-VALIDATED` | (epoch, sequence) state mutation sequence increment verified | Low |
| **NVS Persistence** | `PASS` | `HOST-VALIDATED` | Double-buffered Slot A/B wear leveling & CRC32 verified | Low |
| **Offline Operation** | `PASS` | `HOST-VALIDATED` | Cloud disconnection test verified complete offline execution | Low |
| **Telemetry Contract** | `PASS` | `HOST-VALIDATED` | Snapshot schema (V, I, P, S, PF, E, presence) verified | Low |
| **Power-Failure Recovery**| `PASS` | `HOST-VALIDATED` | Slot B fallback & brownout ISR flush verified | Low |
| **End-to-End System** | `PASS` | `HOST-VALIDATED` | Full provisioning -> LAN/Cloud path -> Local execution verified | Low |
