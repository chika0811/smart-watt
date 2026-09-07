# Spike 1F — Device Logical Version `(epoch, sequence)` & Local Rule Persistence

## 1. Executive Summary & Objective

Spike 1F validates the local state machine, versioning invariants, typed automation rule engine, and double-buffered NVS crash recovery for the Smart Watt ecosystem.

### Core Invariants Preserved
* **Logical Version Envelope**: Monotonic version tuple $V = (\text{epoch}, \text{sequence})$.
* **Observation Non-Increment Rule**: Sensor observations (voltage, current, power, energy readings, presence events) **DO NOT increment `(epoch, sequence)`**.
* **State Mutation Version Rule**: Version sequence increments $+1$ **strictly when a logical device state mutation occurs** (e.g. relay ON/OFF, rule creation/deletion).
* **Autonomous Offline Execution**: Rules compiled by Cypher are stored in MCU NVS and executed locally by the onboard RTC and sensor routines with **zero cloud dependency**.

---

## 2. Operation Classification Matrix

Every incoming command, event, or measurement is classified into one of three authoritative groups:

| Operation Name | Classification | Version Action | Description |
| :--- | :--- | :--- | :--- |
| `RELAY_TOGGLE` | `STATE_MUTATING` | `sequence += 1` | Physical relay state changes (`OFF → ON`) |
| `RULE_CREATE` | `STATE_MUTATING` | `sequence += 1` | Automation rule committed to local NVS |
| `RULE_DELETE` | `STATE_MUTATING` | `sequence += 1` | Automation rule removed from local NVS |
| `RULE_UPDATE` | `STATE_MUTATING` | `sequence += 1` | Rule parameters modified |
| `RULE_ENABLE_DISABLE` | `STATE_MUTATING` | `sequence += 1` | Rule `enabled` flag toggled |
| `FACTORY_RESET` | `STATE_MUTATING` | `epoch += 1, seq = 0` | Factory reset clears NVS and increments epoch |
| `TELEMETRY_VOLTAGE` | `OBSERVATION_ONLY` | **No Change** | Voltage measurement sample |
| `TELEMETRY_CURRENT` | `OBSERVATION_ONLY` | **No Change** | Current measurement sample |
| `TELEMETRY_POWER` | `OBSERVATION_ONLY` | **No Change** | Active/apparent power measurement |
| `TELEMETRY_ENERGY` | `OBSERVATION_ONLY` | **No Change** | Integrated energy counter update |
| `PRESENCE_OBSERVATION`| `OBSERVATION_ONLY` | **No Change** | PIR/mmWave sensor state update |
| `DUPLICATE_COMMAND` | `STATE_NON_MUTATING` | **No Change** | Desired state matches current state |
| `REJECTED_COMMAND` | `STATE_NON_MUTATING` | **No Change** | Stale version sequence check failed |

---

## 3. Cypher → CommandCoordinator → MCU Rule Pipeline

Natural language user requests are parsed into deterministic typed JSON rule schemas:

```text
User Intent: "Turn on the bulb at 7 AM and turn it off at 12 PM"
                     │
                     ▼ (Cypher Intent Parser)
Typed JSON Rule Schema 1: { trigger: "0 7 * * *", action: "relay_1 ON" }
Typed JSON Rule Schema 2: { trigger: "0 12 * * *", action: "relay_1 OFF" }
                     │
                     ▼ (CommandCoordinator & Fingerprint Check)
Deduplication & NVS Write (Slot A / Slot B Mirrored Storage)
                     │
                     ▼ (Local RTC & Automation Engine)
Offline Execution -> Relay Actuation -> Version Mutation (epoch, seq + 1)
```

---

## 4. Double-Buffered NVS Persistence & Crash Recovery

To prevent NVS corruption during power failure or brownout:
* **Slot A / Slot B Mirroring**: Header includes `0x56455253` magic bytes, `epoch`, `sequence`, and CRC32 checksum over payload.
* **Write Pattern**: Slot A is written and verified. Slot B is updated second.
* **Recovery Logic**: If Slot A CRC fails on boot, the MCU recovers state from Slot B cleanly.

---

## 5. Complete Acceptance Test Matrix (27 Tests)

| Test ID | Category / Description | Status |
| :--- | :--- | :--- |
| `VER-01` | Initial version envelope verified `(epoch=1, sequence=0)` | **PASSED** |
| `VER-02` | State mutation (relay toggle) increments sequence to 1 | **PASSED** |
| `VER-03` | Telemetry voltage & presence observations reuse sequence without increment | **PASSED** |
| `VER-04` | Duplicate command produces no state change or sequence increment | **PASSED** |
| `VER-05` | Stale version command (`seq 1 <= active seq 1`) rejected as `DROPPED_STALE` | **PASSED** |
| `VER-06` | Concurrent state mutations serialized cleanly | **PASSED** |
| `VER-07` | Reboot persistence restores exact `(epoch, sequence)` from double-buffered NVS | **PASSED** |
| `VER-08` | Epoch increments on factory reset | **PASSED** |
| `VER-09` | 64-bit sequence counter handles uint64 overflow boundary | **PASSED** |
| `VER-10` | Factory reset clears NVS and resets sequence to 0 | **PASSED** |
| `RULE-01` | Rule creation & local storage | **PASSED** |
| `RULE-02` | Rule persistence across reboot | **PASSED** |
| `RULE-03` | Local RTC schedule execution toggles relay and increments version | **PASSED** |
| `RULE-04` | Disabled rule (`enabled = false`) skipped during evaluation | **PASSED** |
| `RULE-05` | Rule deletion removes record from local NVS | **PASSED** |
| `RULE-06` | Duplicate rule creation detected by fingerprint and rejected | **PASSED** |
| `RULE-07` | Priority conflict resolution (higher priority integer wins) | **PASSED** |
| `RULE-08` | Equal priority deterministic resolution (last committed wins) | **PASSED** |
| `RULE-09` | Malformed rule schema rejected during validation stage | **PASSED** |
| `RULE-10` | Offline RTC schedule execution | **PASSED** |
| `OFFLINE-01` | Installed automation rules remain functional with cloud unavailable | **PASSED** |
| `OFFLINE-02` | Telemetry snapshots buffered locally to flash circular buffer | **PASSED** |
| `OFFLINE-03` | Presence sensor automation evaluated offline without version increment | **PASSED** |
| `CRASH-01` | Interrupted version commit recovered safely from double-buffered Slot B | **PASSED** |
| `CRASH-02` | Interrupted rule commit recovered safely from double-buffered Slot B | **PASSED** |
| `CRASH-03` | Reboot during uncommitted automation safely reverts to last durable state | **PASSED** |
| `CRASH-04` | Recovery from corrupted NVS record | **PASSED** |

---

## 6. Verification Hierarchy Classification

| Component | Validation Level | Notes |
| :--- | :--- | :--- |
| **Logical Version Engine** | `HOST-VALIDATED` | C++ class (`logical_version.cpp`) & JS (`test_logical_version_and_rules.js`) verified |
| **Local Rule Store** | `HOST-VALIDATED` | C++ class (`rule_store.cpp`) & JS verified |
| **Local Automation Engine** | `HOST-VALIDATED` | C++ class (`automation_engine.cpp`) & JS verified |
| **Double-Buffered NVS** | `HOST-VALIDATED` | CRC32 & Slot A/B crash recovery verified in host C++ & JS |
| **Cypher Pipeline** | `SIMULATED` | Natural language to typed JSON rule translation verified |

---

## 7. Execution Instructions

To execute the automated test suite:

```bash
node phase1/spike-1f/tests/test_logical_version_and_rules.js
```
