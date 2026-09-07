# SW-8CH-ESP32-V1 Physical Hardware Anomaly & Defect Tracking Log

## 1. Anomaly & Defect Log Table

| Anomaly ID | Date | Component / Subsystem | Anomaly Description | Severity (Blocker / Major / Minor) | Root Cause Analysis | Corrective Action / Hardware Fix | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ERR-001` | N/A | Hardware Bring-Up | Initial bring-up pending physical PCB prototype attachment to lab bench. | Informational | Hardware physical bench attachment pending. | Execute 14-step bring-up protocol on assembled SW-8CH-ESP32-V1 board. | `OPEN (PENDING BENCH)` |

---

## 2. Severity Classification Rules

* **Blocker**: Any issue causing electrical shock hazard, thermal runaway, insulation breakdown, continuous reboot loop, eFuse corruption, or inability to actuate relays. Must be resolved before high-voltage mains testing.
* **Major**: Calibration error exceeding $1.0\%$, RTC drift exceeding $30\text{ seconds/month}$, BLE pairing drop rate $> 5\%$, or brownout ISR failing to flush RAM buffers. Must be resolved before production.
* **Minor**: Aesthetic silk-screen labeling typos, minor LED brightness variance, or non-critical diagnostic log formatting quirks.
