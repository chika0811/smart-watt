# Smart Watt Physical Hardware Architecture: Revision SW-8CH-ESP32-V1

## 1. Hardware Overview

`SW-8CH-ESP32-V1` is the official reference physical hardware design for the NoskyTech Smart Watt 8-Output Energy Management Node.

### System Specifications
* **Microcontroller**: ESP32-S3-WROOM-1-N16R8 (Xtensa LX7 Dual-Core @ 240MHz, 16MB Flash, 8MB PSRAM, Hardware RSA DS Peripheral, eFuse HMAC).
* **Power Relays**: 8x Independent High-Inrush Power Relays (Omron G5Q-1A / Hongfa HF115F-012-1H3A, rated 16A @ 250VAC).
* **Mains Sensing**: Total Voltage RMS & Total Current RMS via ADE7953 Isolated SPI Metrology IC.
* **Per-Output Current Sensing**: **`false`** (Hardware Revision V1 contains 1 total current channel; per-output channels = 0).
* **Hardware RTC**: PCF8563T I2C RTC with CR2032 Coin Cell Battery Backup.
* **Presence Sensor**: LD2410B 24GHz mmWave Human Static Presence Radar (UART / GPIO interface).
* **Wireless Transceivers**: 2.4GHz Wi-Fi (802.11 b/g/n) & Bluetooth 5 (LE / LESC).
* **Galvanic Isolation**: 3.75kV RMS Reinforced Isolation Barrier separating Mains High Voltage from Low Voltage MCU Digital Domain.

---

## 2. Capability Reporting Contract (`REPORT_CAPABILITIES`)

Hardware Revision `SW-8CH-ESP32-V1` MUST report the following payload to the cloud and mobile app:

```json
{
  "hardware_revision": "SW-8CH-ESP32-V1",
  "mcu": "ESP32-S3-WROOM-1",
  "relay_outputs_count": 8,
  "electrical_sensing_capabilities": {
    "total_mains_voltage_sensor": true,
    "total_mains_current_sensor": true,
    "active_power_calculation": true,
    "apparent_power_calculation": true,
    "power_factor_calculation": true,
    "energy_accumulation": true,
    "total_current_channels": 1,
    "per_output_current": false,
    "per_output_channels": 0
  },
  "rtc": {
    "rtc_hardware_present": true,
    "rtc_chip": "PCF8563T",
    "backup_power": "CR2032_BATTERY",
    "crystal_frequency_hz": 32768
  },
  "sensors": {
    "presence_sensor_type": "MMWAVE_RADAR_LD2410B",
    "distance_ranging_supported": true
  }
}
```
