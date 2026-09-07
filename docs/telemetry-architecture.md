# NoskyTech Ecosystem — Telemetry, Metrology & Analytics Architecture (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & Telemetry Categorization

The Telemetry Architecture decouples real-time actuation state changes from continuous sensor and metrology observations.

```text
Telemetry Data Classifications
├── 1. Real-Time Actuation State (Relay ON/OFF -> Increments epoch/sequence -> Emits ACK/Report)
├── 2. Metrology & Sensor Telemetry Samples (Voltage, Current, Power, Presence -> Reuses active epoch/sequence)
├── 3. Aggregated Local Telemetry (15-minute NVS ring buffer snapshots during offline periods)
└── 4. Historical Analytics & Monthly Summaries (Cloud Timescale/Postgres rollups & mobile UI visualization)
```

---

## 2. Non-Incrementing Version Rule for Telemetry Observations

To satisfy the Phase 0 Revision 4.2 frozen contract:
* **State Transition Events**: Actuation changes (`relay_1 OFF → ON`) increment the monotonic `sequence` counter $V = (\text{epoch}, \text{sequence} + 1)$ and update durable state in NVS.
* **Telemetry Observations**: Electrical measurements ($V_{\text{rms}}$, $I_{\text{rms}}$, $P$, $E$) and periodic heartbeats **REUSE the active Device Logical Version `(epoch, sequence)`** and record observation `timestamp` separately.

### Telemetry Packet Envelope Schema (NDP v1)

```json
{
  "v": 1,
  "msg_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "corr_id": "110e8400-e29b-41d4-a716-446655440000",
  "dev_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "REPORT",
  "ep": 2,
  "seq": 145,
  "payload": {
    "timestamp": 1772193600,
    "electrical": {
      "voltage_v": 230.4,
      "current_total_a": 4.12,
      "power_active_w": 942.3,
      "power_apparent_va": 949.2,
      "power_factor": 0.99,
      "energy_total_kwh": 142.850,
      "per_output": [
        {"instance_id": "current_output_1", "current_a": 2.10, "power_w": 483.8}
      ]
    },
    "sensors": {
      "presence_state": "PRESENT",
      "presence_confidence": 95
    }
  }
}
```

---

## 3. Offline Measurement & Telemetry Buffering Strategy

When Internet or cloud connectivity is unavailable:

```text
Sensors & Metrology Engine
            ↓
  Local Energy Accumulation (E = ∫ P dt in RAM + 15-min NVS Flushes)
            ↓
  Local Flash Circular Ring Buffer (15-minute telemetry snapshots)
            ↓
  Internet Connection Restored
            ↓
  Bulk Telemetry Sync Vector (Pushed to Cloud Gateway)
```

1. **Continuous Metrology**: Energy accumulation continues locally uninterrupted.
2. **Flash Circular Buffer**: Periodic 15-minute telemetry snapshots are written to a dedicated NVS ring buffer partition.
3. **Re-synchronization**: When connectivity returns, the device flushes buffered telemetry frames to the Cloud Gateway.

---

## 4. Monthly Energy Summary & Architectural Responsibilities

```text
[ Physical Smart Watt Device ]
  ├── Authoritative raw & accumulated energy integration (E_total_kwh)
  └── Local RTC daily rollover counter (E_daily_kwh)
            │
            ▼ (MQTTS Telemetry Stream)
[ Cloud Gateway & Analytics Backend ]
  ├── Durable historical time-series storage (PostgreSQL / Timescale)
  ├── Daily / Monthly rollups & aggregation pipelines
  ├── Peak demand analysis & tariff cost calculations
  └── Long-term historical data retention
            │
            ▼ (REST / GraphQL API)
[ Mobile Application ]
  └── Visualization (Interactive graphs, energy breakdown, cost insights)
```
