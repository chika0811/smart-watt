# SW-8CH-ESP32-V1 mmWave Presence Sensor Interface Specification

## 1. Hardware Module & Pin Interface

* **Sensor Module**: Hilink LD2410B 24GHz FMCW mmWave Human Static Presence Radar.
* **Interface Standard**: UART @ $256,000\text{ baud}$ (`TX = GPIO 9`, `RX = GPIO 10`).
* **Power Supply**: +3.3V Digital Rail ($80\text{mA}$ active operating current).
* **Detection Capability**: Detects static, micro-movement, and moving human presence up to $6\text{ meters}$.

---

## 2. State Normalization & Telemetry Rule

The firmware normalizes raw radar frames into three standardized fields:

```text
presence_state     : PRESENT (1) | ABSENT (0) | UNKNOWN (2)
presence_confidence: 0 - 100 (%)
distance_cm        : 0 - 600 (cm)
```

### Critical Logical Version Rule
* **Sensor Observation**: Polling or receiving presence telemetry updates **MUST NOT increment device version sequence `(epoch, sequence)`**.
* **Relay Actuation Trigger**: If a presence state transition triggers a local automation rule that toggles a relay state (`ABSENT → PRESENT → Relay ON`), **the resulting relay mutation DOES increment sequence `(epoch, sequence + 1)`**.
