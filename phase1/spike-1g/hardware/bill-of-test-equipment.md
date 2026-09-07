# Bill of Test Equipment & Hardware Bench Setup

## 1. Physical Hardware Components Under Test (DUT)

| Component Class | Part Number / Model | Manufacturer | Key Specifications |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-S3-WROOM-1-N16R8 | Espressif Systems | 16MB Flash, 8MB PSRAM, RSA DS Peripheral |
| **Relay Modules** | HF115F / Omron G5Q-1A | Hongfa / Omron | 8x 16A 250VAC High-Inrush Power Relays |
| **Hardware RTC** | PCF8563T / DS3231MZ | NXP / Analog Devices | I2C RTC with CR2032 Battery / Supercap Backup |
| **Metrology IC** | ADE7953 / ATM90E26 | Analog Devices / Microchip| Dual-Channel Isolated SPI Energy Metering IC |
| **Galvanic Isolator**| Si8641ED-B-IS | Silicon Labs | 5kV RMS 4-Channel SPI Digital Isolator |
| **Current Sensor** | CT 100A/50mA (SCT-013) | Yhdc | Non-Invasive Current Transformer (Total Current) |
| **Presence Sensor**| LD2410B mmWave / HC-SR501 | Hilink / Custom | 24GHz Human Static Presence mmWave Radar |
| **Power Supply** | HLK-PM01 (5V/3.3V isolated) | Hi-Link | Isolated AC-DC Step-Down Converter |

---

## 2. Laboratory Test & Measurement Equipment

| Instrument Type | Model Number | Calibration Date | Purpose |
| :--- | :--- | :--- | :--- |
| **Digital Oscilloscope** | Keysight DSOX3024T (200MHz, 4-CH)| 2026-01-15 | SPI/I2C protocol timing, relay contact bounce |
| **AC Power Calibrator / Meter**| Fluke 8588A Reference Multimeter | 2026-02-10 | Voltage & Current RMS reference measurement |
| **Programmable AC Load** | Chroma 63804 Programmable Load | 2026-03-01 | Non-linear & reactive load simulation (0-15A) |
| **Isolated HV Differential Probe**| Tektronix THDP0200 (1.5kV) | 2026-01-20 | Mains voltage waveform & transient testing |
| **Logic Analyzer** | Saleae Logic Pro 16 | N/A | ESP32 GPIO, SPI, and UART bus packet capture |
