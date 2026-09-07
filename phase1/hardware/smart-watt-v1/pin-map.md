# SW-8CH-ESP32-V1 Microcontroller Pin Assignment Map

| Function | Signal Name | ESP32-S3 GPIO | Direction | Reset / Boot State | Circuit Interface |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Relay Output 1** | `RELAY_CH1` | `GPIO 4` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 1 Coil |
| **Relay Output 2** | `RELAY_CH2` | `GPIO 5` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 2 Coil |
| **Relay Output 3** | `RELAY_CH3` | `GPIO 6` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 3 Coil |
| **Relay Output 4** | `RELAY_CH4` | `GPIO 7` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 4 Coil |
| **Relay Output 5** | `RELAY_CH5` | `GPIO 15` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 5 Coil |
| **Relay Output 6** | `RELAY_CH6` | `GPIO 16` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 6 Coil |
| **Relay Output 7** | `RELAY_CH7` | `GPIO 17` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 7 Coil |
| **Relay Output 8** | `RELAY_CH8` | `GPIO 18` | Output | Low (OFF) | Optocoupler PC817 -> Transistor Driver -> Relay 8 Coil |
| **RTC I2C Clock** | `RTC_SCL` | `GPIO 1` | Open-Drain | High (Pull-Up) | 4.7k Pull-up -> PCF8563 I2C SCL Pin |
| **RTC I2C Data** | `RTC_SDA` | `GPIO 2` | Open-Drain | High (Pull-Up) | 4.7k Pull-up -> PCF8563 I2C SDA Pin |
| **RTC Interrupt** | `RTC_INT` | `GPIO 3` | Input | High (Pull-Up) | PCF8563 Active-Low Interrupt Pin |
| **Metrology SPI SCLK**| `MET_SCLK`| `GPIO 11` | Output | Low | Si8641 Digital Isolator Channel A -> ADE7953 SCLK |
| **Metrology SPI MISO**| `MET_MISO`| `GPIO 12` | Input | Float | Si8641 Digital Isolator Channel B <- ADE7953 MISO |
| **Metrology SPI MOSI**| `MET_MOSI`| `GPIO 13` | Output | Low | Si8641 Digital Isolator Channel C -> ADE7953 MOSI |
| **Metrology SPI CS** | `MET_CS` | `GPIO 14` | Output | High (Inactive)| Si8641 Digital Isolator Channel D -> ADE7953 CS |
| **Brownout Detect** | `BROWNOUT_DET`| `GPIO 21` | Input | High (Pull-Up) | Power Fail Sensing Voltage Divider (VDD < 2.8V Trigger) |
| **Presence UART TX** | `PRES_TX` | `GPIO 9` | Output | High | LD2410B mmWave Radar RX Pin |
| **Presence UART RX** | `PRES_RX` | `GPIO 10` | Input | High (Pull-Up) | LD2410B mmWave Radar TX Pin |
| **Factory Reset Btn**| `FACTORY_RESET`|`GPIO 0` | Input | High (Pull-Up) | Active-Low Push Button (Press 10s = Reset) |
| **Red Status LED** | `LED_RED` | `GPIO 8` | Output | Low (OFF) | Active-High LED Driver Transistor |
| **Blue Status LED** | `LED_BLUE` | `GPIO 38` | Output | Low (OFF) | Active-High LED Driver Transistor |
