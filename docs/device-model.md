# NoskyTech Ecosystem — Universal Device Abstraction (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & Dynamic Capability Negotiation

The Universal Device Abstraction establishes a strict boundary between physical hardware microcontrollers and high-level appliance control. Generic platform models contain zero hardcoded product assumptions.

### Dynamic Capability Negotiation
The ecosystem does not hardcode endpoint capabilities on the cloud. Upon boot or firmware update, the microcontroller emits a `REPORT_CAPABILITIES` frame over MQTT/LAN. The platform dynamically registers or updates `device_endpoints`:

```json
{
  "v": 1,
  "msg_id": "8c2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
  "corr_id": "110e8400-e29b-41d4-a716-446655441111",
  "dev_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "REPORT_CAPABILITIES",
  "ep": 2,
  "seq": 0,
  "payload": {
    "model": "SW-8CH-ESP32-V1",
    "firmware_version": "1.4.2",
    "endpoints": [
      {"instance_id": "relay_1", "capability_type": "power", "value_type": "boolean"},
      {"instance_id": "relay_2", "capability_type": "power", "value_type": "boolean"},
      {"instance_id": "voltage_mains_1", "capability_type": "voltage", "value_type": "numeric", "unit": "volts"},
      {"instance_id": "current_total_1", "capability_type": "current", "value_type": "numeric", "unit": "amperes"},
      {"instance_id": "power_active_total_1", "capability_type": "power_active", "value_type": "numeric", "unit": "watts"},
      {"instance_id": "energy_total_1", "capability_type": "energy", "value_type": "numeric", "unit": "kwh"},
      {"instance_id": "presence_sensor_1", "capability_type": "presence", "value_type": "object"},
      {"instance_id": "rtc_clock_1", "capability_type": "clock", "value_type": "timestamp"}
    ]
  }
}
```

---

## 2. Universal Device Data Hierarchy

```text
Physical Hardware Device Node
├── Identity (UUID, Serial Number, Wi-Fi / BLE MAC Addresses)
├── Hardware Security (ESP32-S3 RSA-3072 DS Peripheral + eFuse HMAC Key)
├── Product Metadata (Product Code, Model Number, Firmware Version)
├── Boot Generation Record (Boot Epoch, Boot Sequence, Mirrored NVS Slots A/B)
├── Inventory Status (unclaimed, claimed, assigned, decommissioned)
├── Ownership & Location (Home ID, Room ID)
├── Wi-Fi Credential Vault (Customer SSID & Password in Encrypted NVS)
├── Metrology Calibration Vault (v_gain, i_gain, phase_offset in Factory NVS)
├── RTC Clock & Local Timezone Configuration
├── Dynamically Negotiated Endpoints (Exposed capabilities & instance IDs)
├── Authoritative State Machine (Desired, Reported, Authoritative, Quality Status)
├── Local Automation Rule Storage (Typed IF-THEN rules stored in NVS)
└── Multi-Transport Health (IP Address, BLE RSSI, Connection Status)
```

---

## 3. Version Tuple Envelope Contract (NDP v1)

```json
{
  "v": 1,
  "msg_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "corr_id": "110e8400-e29b-41d4-a716-446655440000",
  "dev_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "CMD",
  "ep": 2,
  "seq": 145,
  "payload": {
    "instance_id": "relay_3",
    "capability": "power",
    "desired_value": false,
    "ttl_seconds": 10
  }
}
```

### Hardware Execution Rule (Lexicographical Version Check & Durable Persistence)
```cpp
// ESP32 Microcontroller State Transition vs Observation Rule
bool is_version_valid(uint32_t incoming_epoch, uint64_t incoming_seq, uint32_t active_epoch, uint64_t active_seq) {
    if (incoming_epoch > active_epoch) return true;
    if (incoming_epoch == active_epoch && incoming_seq > active_seq) return true;
    return false;
}

if (is_version_valid(msg.epoch, msg.seq, active_epoch, endpoint_seq[endpoint_index])) {
    actuate_hardware_output(msg.instance_id, msg.desired_value);
    
    // STATE TRANSITION: Increment sequence ONLY upon value change
    if (msg.desired_value != current_endpoint_value[endpoint_index]) {
        endpoint_seq[endpoint_index] = msg.seq;
        current_endpoint_value[endpoint_index] = msg.desired_value;
        // Atomically commit updated state and version to NVS BEFORE returning ACK
        nvs_commit_endpoint_state(msg.instance_id, msg.desired_value, active_epoch, msg.seq);
    }
    
    send_ack_success(msg.msg_id, msg.corr_id, active_epoch, endpoint_seq[endpoint_index]);
} else {
    send_ack_dropped_stale(msg.msg_id, msg.corr_id, active_epoch, endpoint_seq[endpoint_index]);
}
```

---

## 4. SMART WATT Metrology & Endpoint Mapping

Smart Watt implements a metrology measurement engine operating on voltage and current sensing channels:

```text
Mains Voltage Sensor ─────┐
                          ├──> Metrology Engine ──> Active / Apparent Power & PF
Mains Current Sensor ─────┘                       └─> Energy Integration E(t) = ∫ P dt
```

### Endpoint Advertisements (`REPORT_CAPABILITIES`)

```json
{
  "product_code": "NOSKY-SW01",
  "model_number": "SW-8CH-ESP32-V1",
  "endpoints": [
    {"instance_id": "relay_1", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_2", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_3", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_4", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_5", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_6", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_7", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "relay_8", "capability_type": "power", "value_type": "boolean"},
    {"instance_id": "voltage_mains_1", "capability_type": "voltage", "value_type": "numeric", "unit": "volts"},
    {"instance_id": "current_total_1", "capability_type": "current", "value_type": "numeric", "unit": "amperes"},
    {"instance_id": "power_active_total_1", "capability_type": "power_active", "value_type": "numeric", "unit": "watts"},
    {"instance_id": "power_apparent_total_1", "capability_type": "power_apparent", "value_type": "numeric", "unit": "va"},
    {"instance_id": "power_factor_total_1", "capability_type": "power_factor", "value_type": "numeric", "unit": "decimal"},
    {"instance_id": "energy_total_1", "capability_type": "energy", "value_type": "numeric", "unit": "kwh"},
    {"instance_id": "presence_sensor_1", "capability_type": "presence", "value_type": "object"},
    {"instance_id": "rtc_module_1", "capability_type": "clock", "value_type": "timestamp"},
    {"instance_id": "automation_engine_1", "capability_type": "rules_engine", "value_type": "object"}
  ]
}
```

*Rule on Per-Output Current Sensing*: Per-output current endpoints (`current_output_1` through `current_output_8`) are advertised **strictly when the physical hardware revision includes an independent current-sensing channel per relay output**.

### Presence Sensor Normalization Abstraction

Presence sensors (PIR, mmWave, optical) expose a normalized telemetry structure:

```json
{
  "presence_state": "PRESENT",
  "presence_confidence": 95,
  "last_detected_at": 1772193600,
  "distance_cm": 150
}
```
