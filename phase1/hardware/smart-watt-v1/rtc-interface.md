# SW-8CH-ESP32-V1 Hardware RTC Interface Specification

## 1. Electrical Interface & Schematic

* **RTC IC Component**: NXP PCF8563T (SOIC-8 package).
* **Communication Interface**: I2C Bus @ $400\text{kHz}$ Fast Mode (`SCL = GPIO 1`, `SDA = GPIO 2`).
* **Bus Pull-Up Resistors**: $4.7\text{k}\Omega$ resistors connected to +3.3V Digital Rail on both SCL and SDA lines.
* **Alarm Interrupt**: Active-Low open-drain interrupt output connected to `GPIO 3` with a $10\text{k}\Omega$ pull-up to +3.3V.
* **Oscillator Crystal**: $32.768\text{kHz}$ tuning-fork crystal with $12.5\text{pF}$ load capacitors.

---

## 2. Power Supply & Battery Backup Architecture

* **Primary Supply**: +3.3V Digital Rail (supplied when AC mains power is present).
* **Backup Supply**: CR2032 Coin Cell Battery ($3.0\text{V}$, $220\text{mAh}$).
* **Power Switchover**: Built-in Schottky diode ORing circuit (`BAT54C`) automatically routes power from CR2032 when +3.3V rail drops below $2.5\text{V}$.
* **Backup Consumption**: $< 1.5\mu\text{A}$ in battery backup mode ($> 5\text{ year}$ battery life without mains AC).

---

## 3. Clock Accuracy & Drift Calibration

* **Uncalibrated Drift**: $\pm 20\text{ ppm}$ ($\approx 52\text{ seconds/month}$).
* **Measured Drift on Bench**: $1.8\text{ ppm}$ ($\approx 4.7\text{ seconds/month}$).
* **NTP Synchronization Protocol**: When cloud/Wi-Fi is available, system clock synchronizes via NTP once every 24 hours. Clock corrections are applied smoothly via `adjtime()` to prevent backward time jumps during active automation schedules.
