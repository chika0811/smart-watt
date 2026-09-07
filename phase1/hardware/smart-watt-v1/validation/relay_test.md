# SW-8CH-ESP32-V1 Relay Subsystem Low-Voltage Test Protocol (Step 9)

## 1. Safe Low-Voltage Testing Mandate

> **SAFETY MANDATE**:
> Relay driver testing must be performed at low DC voltage ($5\text{V DC} / 12\text{V DC}$) using low-voltage indicator LEDs. **DO NOT connect high-voltage AC mains loads** to verify GPIO logic or driver actuation.

---

## 2. Test Execution Matrix (RELAY-01 to RELAY-08)

| Channel | ESP32 GPIO | Boot State | Active-High Logic | ON Cmd | OFF Cmd | Sequence Increment Rule | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Relay 1** | `GPIO 4` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 2** | `GPIO 5` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 3** | `GPIO 6` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 4** | `GPIO 7` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 5** | `GPIO 15` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 6** | `GPIO 16` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 7** | `GPIO 17` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Relay 8** | `GPIO 18` | Low (0V) | Optocoupler ON @ 3.3V | PASS | PASS | `seq + 1` on mutation; `seq + 0` on dup | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 3. Driver Timing & Concurrency Verification Tasks

- [ ] **Boot Safety Check**: Oscilloscope probes all 8 relay GPIOs during ESP32 reset; verifies $0\text{V}$ steady state (10kΩ pull-downs functional).
- [ ] **Contact Bounce Isolation**: Oscilloscope probes relay contact terminals; contact bounce duration $< 3.5\text{ms}$.
- [ ] **Simultaneous 8-Channel Actuation**: All 8 relays turned ON simultaneously; 5V DC rail supply voltage remains stable ($> 4.75\text{V DC}$) under $560\text{mA}$ total coil current load.
