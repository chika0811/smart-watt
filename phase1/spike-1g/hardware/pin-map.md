# Smart Watt SW-8CH-ESP32-V1 — Microcontroller Pin Allocation & Hardware Map

## 1. ESP32-S3 WROOM-1 Module Pinout Assignment

| Subsystem | Signal Name | ESP32-S3 GPIO | Interface Type | Electrical Specification & Circuit Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **Relay Actuation** | `RELAY_CH1` | `GPIO 4` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH2` | `GPIO 5` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH3` | `GPIO 6` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH4` | `GPIO 7` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH5` | `GPIO 15` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH6` | `GPIO 16` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH7` | `GPIO 17` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| | `RELAY_CH8` | `GPIO 18` | Digital Output | 3.3V Logic → Optocoupler (PC817) → Relay Driver Transistor |
| **Hardware RTC** | `RTC_SCL` | `GPIO 1` | I2C Clock (Master) | 3.3V I2C (400kHz) → PCF8563 / DS3231 RTC IC |
| | `RTC_SDA` | `GPIO 2` | I2C Data (Master) | 3.3V I2C (400kHz) → PCF8563 / DS3231 RTC IC |
| | `RTC_INT` | `GPIO 3` | External Interrupt | Active-Low Alarm Interrupt from RTC IC |
| **Metrology IC** | `METROLOGY_SCLK`| `GPIO 11` | Isolated SPI SCLK | 3.75kV Galvanic Isolator (Si8641) → ADE7953 / ATM90E26 |
| | `METROLOGY_MISO`| `GPIO 12` | Isolated SPI MISO | 3.75kV Galvanic Isolator (Si8641) ← ADE7953 / ATM90E26 |
| | `METROLOGY_MOSI`| `GPIO 13` | Isolated SPI MOSI | 3.75kV Galvanic Isolator (Si8641) → ADE7953 / ATM90E26 |
| | `METROLOGY_CS` | `GPIO 14` | Isolated SPI CS | 3.75kV Galvanic Isolator (Si8641) → ADE7953 / ATM90E26 |
| | `BROWNOUT_DET` | `GPIO 21` | ADC Input / Interrupt| VDD Brownout Detection (Power-Fail Interrupt for NVS commit)|
| **Presence Sensor**| `PRESENCE_TRIG` | `GPIO 9` | Digital Output | 3.3V Logic → mmWave Radar / PIR Sensor Module Trigger |
| | `PRESENCE_ECHO` | `GPIO 10` | Digital Input / UART| 3.3V Logic ← mmWave Radar / PIR Sensor Module State |
| **System Control** | `FACTORY_RESET` | `GPIO 0` | Boot / Interrupt | Internal Pull-Up, Active-Low Button (10s Hold = Reset) |
| | `STATUS_LED_R` | `GPIO 8` | PWM / GPIO | Red Status LED (Active-High) |
| | `STATUS_LED_B` | `GPIO 38` | PWM / GPIO | Blue Status LED (Active-High) |
