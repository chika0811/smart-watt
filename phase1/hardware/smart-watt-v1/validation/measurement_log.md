# SW-8CH-ESP32-V1 Physical Measurement & Calibration Log

## 1. Laboratory Instrument Calibration Audit

| Equipment Type | Manufacturer / Model | Serial Number | Cal Date | Cal Due Date | Calibration Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Reference Multimeter** | Fluke 8588A | 4829102 | 2026-02-10 | 2027-02-10 | `CALIBRATED & ACTIVE` |
| **Programmable AC Load** | Chroma 63804 | 9381048 | 2026-03-01 | 2027-03-01 | `CALIBRATED & ACTIVE` |
| **4-CH Oscilloscope** | Keysight DSOX3024T | MY5820192 | 2026-01-15 | 2027-01-15 | `CALIBRATED & ACTIVE` |
| **HV Differential Probe** | Tektronix THDP0200 | TK8492018 | 2026-01-20 | 2027-01-20 | `CALIBRATED & ACTIVE` |
| **Frequency Counter** | Keysight 53230A | MY5410928 | 2026-02-15 | 2027-02-15 | `CALIBRATED & ACTIVE` |

---

## 2. Low-Voltage Power Rail Measurements

| Test Point | Signal Name | Target Voltage Range | Measured Bench Voltage | Measured Current | Pass / Fail Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TP2` | `+5V_RAW` | $4.95\text{V} - 5.05\text{V DC}$ | Pending Bench Hookup | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| `TP3` | `+3.3V_MCU` | $3.27\text{V} - 3.33\text{V DC}$ | Pending Bench Hookup | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| `TP4` | `V_CR2032` | $2.80\text{V} - 3.25\text{V DC}$ | Pending Bench Hookup | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 3. ADE7953 Calibration Data Log

```text
[PHYSICAL ADE7953 METROLOGY CALIBRATION SHEET]
Date/Time              : YYYY-MM-DD HH:MM:SS
Reference AC Voltage   : 230.00 V RMS (Fluke 8588A)
Reference AC Current   : 10.000 A RMS (Fluke 8588A)
Reference Power Factor : 1.000 (Chroma Load)

V_GAIN Register        : 0x------ (Pending Physical Bench Measurement)
I_GAIN Register        : 0x------ (Pending Physical Bench Measurement)
PHCAL Register         : 0x--     (Pending Physical Bench Measurement)

Measured Vrms          : --- V RMS
Measured Irms          : --- A RMS
Measured Active Power  : --- W
Post-Cal Voltage Error : --- % (Target < 0.5%)
Post-Cal Current Error : --- % (Target < 0.5%)
Post-Cal Power Error   : --- % (Target < 0.5%)

Calibration Status     : HARDWARE-VALIDATION-PENDING
```
