# SW-8CH-ESP32-V1 Hardware Test Point Map & Bench Probing Specification

## 1. PCB Bench Test Points

| Test Point | Signal Name | Voltage Range | Expected Signal | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `TP1` | `GND_DIGITAL` | $0\text{V}$ | Ground reference | Primary Oscilloscope / Logic Analyzer Ground Reference |
| `TP2` | `+5V_RAW` | $4.75 - 5.25\text{V}$ | DC Steady | Unregulated 5V SMPS Power Supply Rail Probe |
| `TP3` | `+3.3V_MCU` | $3.25 - 3.35\text{V}$ | DC Steady | Regulated LDO 3.3V Digital Rail Probe |
| `TP4` | `V_CR2032` | $2.8 - 3.2\text{V}$ | DC Steady | RTC Battery Voltage Probe |
| `TP5` | `ESP_EN` | $0 - 3.3\text{V}$ | High ($3.3\text{V}$) | ESP32-S3 Enable / Reset Line Probe |
| `TP6` | `ESP_IO0` | $0 - 3.3\text{V}$ | High ($3.3\text{V}$) | ESP32-S3 Boot Mode Pin (Low = UART Download Mode) |
| `TP7` | `RTC_SCL` | $0 - 3.3\text{V}$ | $400\text{kHz}$ Square | I2C Clock Signal Probe |
| `TP8` | `RTC_SDA` | $0 - 3.3\text{V}$ | I2C Data Stream | I2C Data Signal Probe |
| `TP9` | `MET_SCLK` | $0 - 3.3\text{V}$ | $1\text{MHz}$ SPI Clock | Metrology Isolated SPI Clock Probe |
| `TP10` | `RELAY_1_DRV` | $0 - 3.3\text{V}$ | Logic Level | GPIO 4 Optocoupler Driver Signal Probe |
