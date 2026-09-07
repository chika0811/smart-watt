# Smart Watt Physical Hardware Revision Model

## Hardware Revision `SW-8CH-ESP32-V1` Specification

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

*Note on Per-Output Sensing*: Hardware Revision `SW-8CH-ESP32-V1` contains 1 total current sensing transformer and 8 power relays. It advertises `per_output_current: false` via `REPORT_CAPABILITIES`. Future revision `SW-8CH-PER-OUTPUT-V2` with 8 shunt resistors will advertise `per_output_current: true` and 8 channels.
