# SW-8CH-ESP32-V1 Metrology Interface & Physical Calibration Protocol

## 1. Metering Topology & Hardware Channel Count

* **Metrology IC**: Analog Devices ADE7953 Dual-Channel Energy Metering IC.
* **Galvanic Isolation**: Silicon Labs Si8641 4-Channel $5\text{kV RMS}$ Digital Isolator for SPI bus (`SCLK = GPIO 11`, `MISO = GPIO 12`, `MOSI = GPIO 13`, `CS = GPIO 14`).
* **Mains Voltage Sensing Channel**: Potential Divider network ($4 \times 470\text{k}\Omega$ 1206 resistors) stepping down 240VAC to $\pm 500\text{mV}$ peak differential signal into ADE7953 Voltage Channel (Channel VP-VN).
* **Mains Current Sensing Channel**: Non-invasive Current Transformer (SCT-013 100A/50mA) with $33\Omega$ burden resistor connected to ADE7953 Current Channel A (Channel IAP-IAN).
* **Hardware Revision V1 Channel Capability**:
  * `total_current_channels`: **1**
  * `per_output_current_channels`: **0**
  * `per_output_current`: **`false`**

---

## 2. Physical Calibration Procedure (Target: $< 0.5\%$ Accuracy)

Physical calibration requires a calibrated AC reference meter (e.g. Fluke 8588A / Chroma Programmable Load):

### Step 1: Voltage Gain Calibration ($V_{\text{GAIN}}$)
1. Apply pure $230.00\text{V RMS}$ $50\text{Hz}$ sine wave from reference AC source.
2. Read raw ADE7953 register `VVRMS`.
3. Compute $V_{\text{GAIN}} = \frac{230.00}{\text{VVRMS}_{\text{raw}}}$. Write $V_{\text{GAIN}}$ to MCU NVS storage.

### Step 2: Current Gain Calibration ($I_{\text{GAIN}}$)
1. Connect $10.000\text{A RMS}$ pure resistive load ($2300.0\text{W}$).
2. Read raw ADE7953 register `AIRMS`.
3. Compute $I_{\text{GAIN}} = \frac{10.000}{\text{AIRMS}_{\text{raw}}}$. Write $I_{\text{GAIN}}$ to MCU NVS.

### Step 3: Phase Offset Calibration ($\text{PHCAL}$)
1. Connect inductive load with known power factor $\cos\theta = 0.500$ ($60^\circ$ phase lag).
2. Measure active power $P_{\text{raw}}$ and apparent power $S_{\text{raw}}$.
3. Adjust ADE7953 `PHCAL` register until measured power factor equals $0.500 \pm 0.002$.
