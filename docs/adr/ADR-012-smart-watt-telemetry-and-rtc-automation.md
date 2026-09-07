# ADR-012: Smart Watt Electrical Telemetry, Metrology Engine, RTC Automation, and Wi-Fi Credential Architecture

* **Status**: Approved with Integration Conditions
* **Date**: 2026-08-28
* **Deciders**: NoskyTech Core Architecture Team

---

## 1. Context & Problem Statement

The Smart Watt product specification expands from a simple relay controller into a full intelligent electrical management appliance. To ensure rigorous engineering standards prior to Phase 1E implementation, formal technical contracts are required for:
1. Electrical Metrology Model & Energy Calculation ($E = \int P dt$).
2. Per-Output Sensing vs Total Sensing topology rules.
3. Electrical Safety Standards, Creepage, Clearance, and Insulation Boundaries.
4. Hardware RTC Contract, Time Synchronization, & Missed Schedule Recovery.
5. Typed Automation Rule Schema, Rule Conflict Resolution, & Local Execution Engine.
6. Proximity / Presence Sensor Abstraction (`presence_state`, `presence_confidence`).
7. Telemetry Observation Versioning, Offline Flash Buffering, and Monthly Aggregation.
8. Explicit prohibition of automated 30-day Wi-Fi credential deletion.

---

## 2. Architectural Decisions & Technical Contracts

### 2.1 Electrical Metrology Engine & Energy Integration
* **Architectural Model**:
  ```text
  Mains Voltage Sensor ─────┐
                            ├──> Metrology Measurement Engine ──> Active/Apparent Power & PF
  Mains Current Sensor ─────┘                                 └─> Energy Integration E(t)
  ```
* **Metrology Definitions**:
  * **Measured Quantities**: RMS Mains Voltage ($V_{\text{rms}}$, Volts) and RMS Total Current ($I_{\text{rms}}$, Amperes).
  * **Calculated Quantities**:
    * **Active / Real Power**: $P = V_{\text{rms}} \cdot I_{\text{rms}} \cdot \cos\theta$ (Watts).
    * **Apparent Power**: $S = V_{\text{rms}} \cdot I_{\text{rms}}$ (VA).
    * **Power Factor**: $\text{PF} = P / S$ (Unitless decimal, $0.00 - 1.00$).
    * **Accumulated Energy**: $E(t) = \int_{0}^{t} P(\tau) \, d\tau$ (Watt-hours / kWh).
* **Energy Calculation Engine**:
  * **Sample Interval**: Discrete Integration every $\Delta t = 1000\text{ ms}$ ($1\text{ second}$ tick).
  * **Integration Method**: Riemann / Trapezoidal Sum ($E_{\text{accum\_mWh}} += P_{\text{active\_W}} \cdot 1000\text{ ms} / 3600$).
  * **Precision**: 64-bit unsigned integer accumulator in milliwatt-hours (`mWh`) in RAM (prevents overflow for $> 100\text{ years}$). Telemetry reports express `kWh` rounded to 3 decimal places ($1\text{ Wh}$ resolution).
  * **Durable Persistence & NVS Wear**: Uncommitted accumulator held in RAM. Double-buffered wear-leveled NVS slots (Slot A/B) committed every 15 minutes OR upon sudden power-fail brownout interrupt. Maximum uncommitted data loss on hard crash is bounded to $\le 15\text{ minutes}$.
  * **Reboot Recovery**: MCU reads latest valid NVS energy slot, loads $E_{\text{nvs}}$, and resumes integration.
  * **Rollover Handling**: Lifetime accumulator ($E_{\text{total\_kwh}}$) never resets. Daily accumulator ($E_{\text{daily\_kwh}}$) resets at local RTC midnight ($00:00:00$).
  * **Clock Corrections**: Step adjustments to RTC update timestamps but DO NOT alter real-time integrated energy accumulators.
  * **Invalid Measurements**: Out-of-bounds samples ($V > 300\text{V}$, $I > 100\text{A}$) are rejected; integration skips invalid ticks. Calibration gains/offsets are stored in factory NVS partition (`cal_v_gain`, `cal_i_gain`, `cal_phase_offset`).

### 2.2 Per-Output Sensing vs Total Sensing Topology
* **Channel Independence Invariant**: Hardware with a single total-current sensing channel MUST NOT claim or advertise independent current/power readings for individual relay outputs.
* **Capability Negotiation**: Per-output endpoints (`current_output_1`, `power_output_1`, `energy_output_1`) are advertised via `REPORT_CAPABILITIES` **strictly when independent hardware current-sensing channels exist per output**.

### 2.3 Electrical Safety Standards & Isolation Boundaries
```text
[ High-Voltage Mains (110-240VAC) ]
                 │
  (Galvanic / Optocoupler Isolation Barrier)
                 │
[ Metrology IC / Sensing Subsystem (CT / Shunt + Isolated ADC) ]
                 │
  (Low-Voltage Isolated SPI / I2C Interface)
                 │
[ ESP32-S3 Microcontroller Domain (3.3V Low-Voltage) ]
```
* **Prohibition**: Exposing mains high voltage directly to the ESP32 ADC input pins is **STRICTLY PROHIBITED**.
* **Electrical Safety Standards & Hardware Validation Requirements**:
  * **Applicable Standards**: Compliance with **IEC/EN 61010-1**, **IEC/EN 60664-1**, **UL 60730-1**, and **IEC 62368-1**.
  * **Isolation Requirements**: Reinforced / Double Insulation barrier ($\ge 3.75\text{kV RMS}$ withstand voltage).
  * **Creepage & Clearance Parameters**: Final PCB layout must specify Overvoltage Category (OVC II / OVC III), Pollution Degree (Degree 2), and PCB Substrate Comparative Tracking Index (CTI $\ge 175$) to determine minimum creepage ($\ge 3.0\text{mm} - 6.3\text{mm}$) and clearance ($\ge 1.5\text{mm} - 3.0\text{mm}$).
  * **Validation Classification**: All safety insulation, sensing component selection, and trace separation are marked as **HARDWARE VALIDATION REQUIREMENTS** pending physical PCB design and lab bench testing.

### 2.4 RTC Contract & Offline Automation Execution
* **Hardware Interface**: Dedicated external RTC IC (I2C) or internal ESP32-S3 RTC with dedicated $32.768\text{ kHz}$ crystal.
* **Backup Power**: Supercapacitor or CR2032 battery backup maintains RTC clock during mains outages.
* **Timezone & DST**: Provisioning sets IANA timezone string (e.g. `"Africa/Lagos"`). MCU maintains local UTC offset and DST rule table in NVS.
* **RTC Validity & Loss of Backup**: Flag `rtc_valid` tracks sync state. If cold-booted with dead backup battery (`rtc_valid = false`), schedules requiring absolute time are paused until NTP/cloud or BLE time sync occurs; relative interval timers continue operating.
* **Missed Schedule Recovery Policy**: Upon reboot post-outage, the rule engine evaluates `missed_schedule_policy`:
  * `CATCH_UP`: Executes missed action immediately if outage duration was $< 1\text{ hour}$.
  * `IGNORE`: Skips missed schedule and waits for next RTC trigger.
* **Precision**: Schedule evaluation precision is $\pm 1\text{ second}$.

### 2.5 Typed Automation Rule Schema & Conflict Resolution
```json
{
  "rule_id": "rule-550e8400-e29b-41d4-a716-446655440000",
  "enabled": true,
  "name": "Evening Porch Light",
  "trigger": {
    "type": "TIME_TRIGGER",
    "cron": "0 19 * * *",
    "sensor_instance_id": null
  },
  "conditions": [
    {"field": "presence_state", "operator": "EQUALS", "value": "ABSENT"}
  ],
  "actions": [
    {"type": "SET_OUTPUT", "endpoint_instance_id": "relay_1", "capability": "power", "desired_value": true}
  ],
  "schedule": {"timezone": "Africa/Lagos", "dst_active": false},
  "execution_policy": {"missed_schedule_policy": "IGNORE", "retry_count": 3, "priority": 10}
}
```
* **Local Runtime**: The MCU local rule engine parses and executes installed NVS rules independently of Cypher or cloud connectivity.
* **Rule Conflict & Edge Case Handling**:
  * **Conflicting Rules**: Evaluated by explicit `priority` integer (higher priority wins). If equal priority, the last-committed rule in NVS wins.
  * **Duplicate Rules**: Deduplicated during parse stage by computing a deterministic rule fingerprint (SHA-256 hash of trigger + condition + action).
  * **Disabled Rules**: Setting `enabled = false` preserves rule parameters in NVS while skipping runtime trigger evaluation.
  * **Invalid Rules**: Malformed JSON or non-existent endpoint references are rejected during `CommandCoordinator` validation prior to NVS write.

### 2.6 Proximity / Presence Sensor Abstraction
* **Normalized Sensor State Model**:
  ```text
  presence_state       : enum (PRESENT, ABSENT, UNKNOWN)
  presence_confidence  : uint8 (0 to 100%)
  last_detected_at     : uint64 (unix timestamp)
  distance_cm          : numeric (optional, where hardware supports ranging)
  ```
* Physical sensor types (PIR, mmWave radar, optical) are normalized into `presence_state`. Specific capabilities are advertised via `REPORT_CAPABILITIES`.

### 2.7 Telemetry Architecture, Versioning & Offline Buffering
* **Non-Incrementing Versioning Rule**: Telemetry observations (voltage, current, power, energy readings) **DO NOT increment the Device Logical Version `(epoch, sequence)`** when relay output states have not changed. Telemetry frames reuse active `(epoch, sequence)` and record `timestamp` separately, preserving the frozen Phase 0 contract.
* **Offline Buffering**: In the absence of cloud/Internet connectivity, real-time measurements continue locally. Periodic telemetry snapshots (15-minute intervals) are stored in an NVS circular flash buffer. Upon reconnect, the device executes a bulk telemetry sync to the Cloud Gateway.
* **Monthly Aggregation Boundary**: The device maintains authoritative raw and accumulated energy measurements ($E_{\text{total\_kwh}}$). The Cloud Gateway performs durable historical storage, daily/monthly rollups, cost estimation, and analytics. Mobile apps consume cloud rollups for visualization.

### 2.8 Wi-Fi Credential Lifecycle Prohibition
* **Rule**: 30-day credential rotation is strictly an **optional user security reminder prompt in the mobile application**. Automated invalidation, deletion, or disconnection of customer router Wi-Fi credentials after 30 days is **STRICTLY PROHIBITED**.

---

## 3. Compliance & Phase 0 Invariants

* **Frozen Contracts Preserved**: All Phase 0 Revision 4.2 contracts (RSA-3072 DS peripheral, eFuse HMAC, BLE LESC OOB, Noise transport, `lan_trust_credential`, Postgres RLS, `(epoch, sequence)` versioning, and Cypher non-interactive tool execution) remain 100% frozen and intact.
