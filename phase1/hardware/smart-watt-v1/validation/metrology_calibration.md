# SW-8CH-ESP32-V1 Metrology Physical Calibration Protocol (Step 11)

## 1. Electrical Setup & Safety Isolated Test Source

Physical metrology calibration requires an isolated bench setup to prevent mains shock hazard:

```text
[ AC Mains Voltage ] ──> [ 1:1 Safety Isolation Transformer (1500VA) ] ──> [ Variable Auto-Transformer (0-250V) ]
                                                                                   │
[ Programmable AC Load ] <── [ Fluke 8588A Reference Meter ] <── [ ADE7953 Sensing Terminals ]
```

---

## 2. Capability Contract Audit

* `total_mains_voltage_sensor`: `true`
* `total_mains_current_sensor`: `true` (1 total current CT transformer)
* `per_output_current`: **`false`** (0 per-output sensing channels)
* **Mobile App Presentation Constraint**: The mobile application MUST display total V, total I, active P, apparent S, PF, and total kWh. It **MUST NOT claim or display per-output current or power** for individual relays.

---

## 3. Physical Calibration Constants & Measurement Log

| Parameter | Register / Constant Name | Default Uncalibrated Value | Calibration Target | Post-Calibration Constant | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Voltage Gain** | `V_GAIN` | `0x000000` | $230.00\text{V RMS} \pm 0.05\text{V}$ | Pending Bench Calibration | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Current Gain** | `I_GAIN` | `0x000000` | $10.000\text{A RMS} \pm 0.005\text{A}$ | Pending Bench Calibration | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Phase Offset** | `PHCAL` | `0x00` | $\text{PF} = 0.500 \pm 0.002$ | Pending Bench Calibration | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |

---

## 4. Calibration Error Log Table

| Test Condition | Reference Load (Fluke 8588A) | Pre-Cal Raw Readout | Pre-Cal Error (%) | Post-Cal Readout | Post-Cal Error (%) | Result Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Resistive Voltage** | $230.00\text{V RMS}$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Resistive Current** | $5.000\text{A RMS}$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Full Load Current** | $15.000\text{A RMS}$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Active Power 1kW** | $1000.0\text{W}$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Reactive Load (PF 0.5)**| $\text{PF} = 0.500$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
| **Energy Accumulation**| $1.000\text{kWh}$ | --- | --- | --- | --- | `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` |
