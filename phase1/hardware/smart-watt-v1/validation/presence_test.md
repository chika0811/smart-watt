# SW-8CH-ESP32-V1 mmWave Presence Sensor Physical Test Protocol (Step 10)

## 1. Test Objective & Protocol

Physically validate the LD2410B 24GHz mmWave radar sensor UART communication, state normalization, and version non-increment invariants during room walk-testing.

---

## 2. Test Execution Matrix (PRES-01 to PRES-05)

| Test ID | Scenario | Expected Physical Result | Sequence Version Increment Rule | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PRES-01** | Empty Room Walk-Out | Sensor transitions to `presence_state = ABSENT (0)`, `confidence = 0%`. | `seq + 0` (Observation does not increment version) | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PRES-02** | Room Entry Walk-In | Sensor transitions to `presence_state = PRESENT (1)`, `confidence = 98%`, `distance_cm = 180`. | `seq + 0` (Observation does not increment version) | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PRES-03** | Presence Automation Trigger | Local rule fires (`PRESENT -> Relay 1 ON`); Relay 1 actuates ON. | **`seq + 1`** (Relay state mutation increments version) | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PRES-04** | Offline Presence Automation | Internet disconnected; presence radar trigger continues actuating relay locally. | **`seq + 1`** (Relay state mutation increments version) | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PRES-05** | Sensor Disconnect Handling | Sensor cable unplugged; state gracefully defaults to `UNKNOWN (2)`. | `seq + 0` (System remains stable) | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
