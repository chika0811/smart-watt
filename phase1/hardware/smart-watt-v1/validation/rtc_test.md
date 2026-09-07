# SW-8CH-ESP32-V1 Hardware RTC Physical Test Protocol (Step 8)

## 1. Test Objective & Scope

Physically validate the PCF8563 I2C hardware RTC, CR2032 battery backup retention, crystal oscillator drift, midnight rollover, and offline schedule execution.

---

## 2. Test Execution Matrix (RTC-01 to RTC-08)

| Test ID | Test Scenario | Target Hardware Criterion | Status |
| :--- | :--- | :--- | :--- |
| **RTC-01** | Initial Time Provisioning | Date/Time written via I2C (`2026-08-28 14:00:00 UTC`); verified via I2C readback. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-02** | Timezone Adjustment | POSIX timezone string applied (`EST5EDT,M3.2.0,M11.1.0`); local epoch offset correctly calculated. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-03** | Reboot Persistence | Mains power power-cycled; RTC time persists across MCU hard reset. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-04** | CR2032 Battery Retention | Mains power removed for 24 hours; CR2032 maintains accurate time without mains VDD. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-05** | Oscillator Drift Measurement | Frequency counter probes $32.768\text{kHz}$ output; drift measured vs NTP ($< 15\text{ sec/month}$ target). | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-06** | Midnight Rollover | RTC rolls over from `23:59:59` to `00:00:00`; date increments cleanly. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-07** | Missed Schedule CATCH_UP | Device powered off during scheduled 07:00 trigger; upon 07:15 boot, CATCH_UP fires schedule. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **RTC-08** | Missed Schedule IGNORE | Schedule configured with IGNORE policy; past schedule skipped cleanly on boot. | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 3. Physical Measurement Log Template

```text
[PHYSICAL RTC DRIFT MEASUREMENT LOG]
Measurement Interval : 24.0 Hours (86,400 Seconds)
Initial NTP Time     : T0 = 1772193600.000 s
Final RTC Readout    : T1 = 1772280000.155 s
Delta Error          : +0.155 Seconds / 24 Hours
Calculated Drift Rate: +1.79 ppm (+4.75 Seconds / Month)
Result               : HARDWARE-VALIDATION-PENDING (BENCH ATTACHMENT REQUIRED)
```
