# Phase 1G Hardware Validation Preparation & Integration Gate Report

## 1. What is Genuinely Validated

The following software state engines, C++ firmware drivers, cryptographic protocols, and data contracts have been fully implemented, compiled, and **HOST-VALIDATED / ESP-IDF-BUILD-VALIDATED**:

* **Logical Version Engine `(epoch, sequence)`**: Monotonic sequence incrementing $+1$ on state mutations (relay toggle, rule create/delete) and non-incrementing on telemetry/presence observations (`VER-01` to `VER-10` passed).
* **Double-Buffered NVS Wear-Leveling & Crash Recovery**: Slot A/B dual persistence with CRC32 checksums, flash endurance protection (0 flash writes on telemetry observations), and Slot B fallback recovery (`CRASH-01` to `CRASH-04` passed).
* **Local Offline Automation Engine**: Cypher natural language parsing ("Turn bulb ON at 7 AM and OFF at 12 PM") into typed JSON rules, local RTC cron schedule execution, and offline execution without cloud connectivity (`RULE-01` to `RULE-10`, `OFFLINE-01` to `OFFLINE-03` passed).
* **MQTT 5.0 SASL Enhanced Authentication**: Challenge-response transcript signature verification (`NOSKY-RSA3072-PSS`) using RSA-3072 PSS and Redis/DB ACL topic scoping (`MQTT-01` to `MQTT-20` passed).
* **BLE LESC OOB & Customer Wi-Fi Credential Lifecycle**: Zero hardcoded Wi-Fi credentials; encrypted GATT provisioning flow, optional mobile app 30-day credential reminder policy (no auto-deletion), and Noise LAN transport (`BLE-01` to `BLE-10` passed).
* **ESP-IDF v5.x Firmware Drivers**: C++ driver compilation for 8-channel active-high relay drivers, PCF8563 I2C RTC, ADE7953 isolated SPI metrology IC, and LD2410B mmWave presence radar (`hil_drivers.cpp` & `hil_main.cpp` compiled).

---

## 2. What is Currently Simulated / Host-Validated

The following protocol interactions and data transformations are currently running in host C++ or Node.js contract test suites:

* **Noise LAN Session Handshake**: Algorithmic Noise_XX key exchange validated in host C++.
* **Redis Caching & DB Fallback**: Cache-aside public key vault lookups and fallback during Redis outages validated in Node.js test suite.
* **Cypher Intent Translation**: Natural language prompt compilation into typed JSON rule schemas validated in host client simulation (`rule_test_client.js`).

---

## 3. What Requires Physical Hardware (`PHYSICAL-HARDWARE-VALIDATED`)

The following physical phenomena and silicon-level features CANNOT be validated by software or compilation alone and require physical bench execution:

* **ESP32-S3 Hardware DS Peripheral & eFuse Key Burning**: Verification of hardware RSA signature timing and eFuse key block read protection on physical silicon (`DS-01` to `DS-06`).
* **RF Performance**: 2.4GHz Wi-Fi 802.11 b/g/n and BLE 5.0 LESC RF signal range, antenna matching, and GATT throughput on physical ESP32-S3 module.
* **Physical Relay Contact Timing & Switching**: GPIO optocoupler driver voltage levels, contact bounce duration, and 16A switching under live AC load.
* **Physical Metrology Calibration**: ADE7953 isolated SPI voltage/current gain calibration ($V_{\text{GAIN}}$, $I_{\text{GAIN}}$, $\text{PHCAL}$) and accuracy verification against Fluke 8588A reference meter.
* **Hardware RTC Battery Backup Switchover**: PCF8563 VDD brownout switchover to CR2032 coin cell and physical oscillator drift measurement over 30 days.
* **mmWave Radar Physical Ranging**: LD2410B 24GHz radar human static presence detection range and false positive rejection under real room environmental conditions.
* **Hardware Brownout Interrupt**: Physical VDD drop interrupt triggering ESP32 GPIO 21 ISR to flush active RAM energy buffers to NVS within $15\text{ms}$.

---

## 4. Exact Hardware Tests Still Required

1. **Physical Relay 8-Channel Actuation Test**: Execute `OFF → ON → OFF` across all 8 channels sequentially and simultaneously under continuous 16A load; verify $0\text{V}$ boot state.
2. **Physical RTC Drift & Rollover Test**: Measure 32.768kHz crystal frequency on bench frequency counter; verify time retention during 24-hour mains power disconnect.
3. **Physical Metrology 3-Point Calibration**: Apply $230.0\text{V RMS}$ voltage and $10.0\text{A RMS}$ load; verify measurement accuracy is $< 0.5\%$.
4. **Physical mmWave Presence Test**: Execute `ABSENT → PRESENT → ABSENT` walk-testing; verify presence observations do NOT increment `(epoch, sequence)` while resulting relay mutations DO increment `sequence`.
5. **Physical Power-Failure Sequence Test**: Cut AC mains power during active energy accumulation; verify brownout ISR flushes buffer and Slot B NVS recovery restores durable state on reboot.
6. **Physical End-to-End Workflow Test**: Execute full 21-step flow from physical QR code scan to offline automation and post-reconnect telemetry synchronization.

---

## 5. Required Test Equipment

* **Calibrated Reference AC Multimeter**: Fluke 8588A / Fluke 87V.
* **Programmable AC Power Source / Load**: Chroma 63804 Programmable AC Load ($0 - 15\text{A}$, variable power factor).
* **4-Channel Digital Storage Oscilloscope**: Keysight DSOX3024T (200MHz, isolated probes) for SPI/I2C and relay bounce timing.
* **High-Voltage Isolated Differential Probe**: Tektronix THDP0200 ($1.5\text{kV}$ rating).
* **Logic Analyzer**: Saleae Logic Pro 16 for ESP32 GPIO and UART bus sniffing.

---

## 6. Safety Gates

* **Galvanic Isolation Gate**: Minimum $3.75\text{kV RMS}$ isolation between mains AC and low-voltage MCU digital domain. PCB trace creepage $\ge 6.0\text{mm}$, clearance $\ge 3.0\text{mm}$.
* **Overcurrent Protection Gate**: 15A ceramic primary fuse and MOV 470V surge suppressor installed on AC Live input.
* **Enclosure Protection Gate**: All mains high-voltage circuitry housed inside IP20 finger-safe UL 94-V0 flame-retardant enclosure. **Un-enclosed mains bench testing is strictly prohibited.**

---

## 7. Current SW-8CH-ESP32-V1 Capability Matrix

```json
{
  "hardware_revision": "SW-8CH-ESP32-V1",
  "mcu": "ESP32-S3-WROOM-1",
  "relay_outputs_count": 8,
  "electrical_sensing_capabilities": {
    "total_mains_voltage_sensor": true,
    "total_mains_current_sensor": true,
    "active_power_calculation": true,
    "apparent_power_calculation": true,
    "power_factor_calculation": true,
    "energy_accumulation": true,
    "total_current_channels": 1,
    "per_output_current": false,
    "per_output_channels": 0
  },
  "rtc": {
    "rtc_hardware_present": true,
    "rtc_chip": "PCF8563T",
    "backup_power": "CR2032_BATTERY",
    "crystal_frequency_hz": 32768
  },
  "sensors": {
    "presence_sensor_type": "MMWAVE_RADAR_LD2410B",
    "distance_ranging_supported": true
  }
}
```

*Mobile App UI Rule*: The application MUST display total current, total active power, total apparent power, power factor, and total energy, but **MUST NOT display per-output current/power** for `SW-8CH-ESP32-V1` since `per_output_current` is `false`.

---

## 8. Conditions Required Before Production

1. Flash firmware onto physical `SW-8CH-ESP32-V1` prototype PCB assemblies.
2. Complete 3-point metrology physical calibration ($V_{\text{GAIN}}$, $I_{\text{GAIN}}$, $\text{PHCAL}$) and verify error $< 0.5\%$.
3. Execute physical thermal test under 8-channel 16A full load for 24 hours.
4. Obtain NRTL electrical safety certification (UL 60730-1 / IEC 61010-1 compliance).

---

## 9. Recommended Next Development Step

**Proceed with Phase 1G Physical Lab Bench Flash & Calibration**.

Do NOT modify frozen Phase 0 Revision 4.2 software contracts or start Phase 2 redesigns. Focus entirely on executing the physical bring-up sequence on the assembled `SW-8CH-ESP32-V1` hardware bench.
