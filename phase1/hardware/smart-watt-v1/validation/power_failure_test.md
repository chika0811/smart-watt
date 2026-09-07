# SW-8CH-ESP32-V1 Power-Failure & Brownout Physical Test Protocol (Step 12)

## 1. Laboratory Safety Power-Failure Test Procedure

Testing power failure handling must be conducted using a programmable DC power supply ramping down the low-voltage supply rail (`TP2 +5V_RAW`) from $5.0\text{V}$ to $0.0\text{V}$ at controlled slew rates ($1\text{V/s}$, $10\text{V/s}$, $100\text{V/s}$).

---

## 2. Test Execution Matrix (PWR-01 to PWR-05)

| Test ID | Power Failure Scenario | Expected System Recovery Behavior | Target Data Loss Limit | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PWR-01** | Power Loss During Version Write | VDD drops during double-buffered NVS write; MCU recovers durable state from Slot B on boot. | **0 version records lost** | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PWR-02** | Power Loss During Rule Commit | VDD drops during rule addition; Slot B checksum validation restores intact rule store. | **0 rule store corruptions** | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PWR-03** | VDD Brownout ISR Flush | Voltage drops below 2.8V; GPIO 21 brownout ISR flushes active RAM energy accumulator to NVS before cutoff. | **< 15 seconds energy data lost** | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PWR-04** | RTC Time Retention | Mains power removed for 60 minutes; CR2032 maintains RTC clock; time restored seamlessly on boot. | **0 time drift anomaly** | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **PWR-05** | Relay Boot Safe State | Mains power restored; all 8 relays boot in OFF state ($0\text{V}$) before automation engine evaluates NVS state. | **0 illegal pulse outputs** | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 3. Declared Data Loss & Boundary Limits

* **Logical Version `(epoch, sequence)`**: **0 Loss Allowed** (Double-buffered Slot A/B mirroring ensures atomic sequence commit).
* **Automation Rule Store**: **0 Loss Allowed** (Rule store modifications protected by Slot A/B CRC32 checksums).
* **Energy Accumulation**: **Maximum 15 Minutes Un-Flushed RAM Data Loss** under catastrophic sudden supply collapse ($> 500\text{V/s}$ slew rate bypassing brownout ISR).
