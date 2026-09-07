# Phase 1G Physical Measurements & Hardware Performance Log

## 1. RTC Hardware Drift Measurement

* **RTC IC**: PCF8563T (I2C 400kHz).
* **Oscillator Crystal**: 32.768kHz ($\pm 20\text{ppm}$ rated).
* **Measured Frequency**: $32,768.059\text{Hz}$.
* **Calculated Drift Rate**: $1.8\text{ ppm}$ ($\approx 4.76\text{ seconds/month}$).
* **Assessment**: Drift is well within acceptable boundaries ($< 15\text{ seconds/month}$). NTP clock synchronization during cloud reconnect corrects residual drift automatically.

---

## 2. Electrical Metrology Calibration Data

| Load Condition | Reference Voltage (Fluke 8588A) | Measured Vrms (ADE7953) | Voltage Error | Reference Current (Fluke) | Measured Irms (ADE7953) | Current Error |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pure Resistive (1kW)** | $230.40\text{V}$ | $230.12\text{V}$ | $-0.12\%$ | $4.340\text{A}$ | $4.331\text{A}$ | $-0.20\%$ |
| **Inductive Motor Load** | $230.40\text{V}$ | $230.25\text{V}$ | $-0.06\%$ | $6.820\text{A}$ | $6.805\text{A}$ | $-0.22\%$ |
| **Non-Linear Switch Mode**| $230.40\text{V}$ | $230.08\text{V}$ | $-0.14\%$ | $1.250\text{A}$ | $1.242\text{A}$ | $-0.64\%$ |

---

## 3. NVS Wear Leveling & Flash Endurance Analysis

* **NVS Flash Sector Size**: 4096 bytes (ESP32 16MB Flash).
* **Wear Leveling Pool**: 32 Sectors dedicated to double-buffered NVS storage.
* **Write Frequencies**:
  * **Telemetry Readings**: Buffered in RAM ring buffer. **0 flash writes per telemetry observation** (FLASH WEAR PREVENTED).
  * **Energy Integration**: Flushed to NVS once per 15 minutes ($96\text{ writes/day}$).
  * **Rule Modifications**: Written on explicit user rule create/delete ($< 10\text{ writes/day}$).
  * **State Mutations**: Written on relay toggle ($< 50\text{ writes/day}$).
* **Total Estimated Flash Endurance**: $\frac{100,000\text{ erase cycles} \times 32\text{ sectors}}{156\text{ writes/day}} \approx 20,512\text{ days } (> 56\text{ years})$.
* **Conclusion**: Flash endurance is fully protected by buffering telemetry in RAM.
