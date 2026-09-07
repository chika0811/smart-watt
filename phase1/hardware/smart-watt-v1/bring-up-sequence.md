# SW-8CH-ESP32-V1 Physical Hardware Bring-Up Sequence

## Step-by-Step Bench Inspection & First-Power Protocol

### Phase A: Un-Powered Cold Resistance & Short Circuit Check
1. **Visual Inspection**: Verify surface mount soldering, component polarity (optocouplers, diodes, electrolytic capacitors), and isolation slot cleanliness.
2. **Resistance Audits (DMM in Ohms)**:
   * Measure resistance between `+5V_RAW` and `GND_DIGITAL`: Must be $> 10\text{k}\Omega$ (No short).
   * Measure resistance between `+3.3V_MCU` and `GND_DIGITAL`: Must be $> 5\text{k}\Omega$ (No short).
   * Measure resistance across AC Live and AC Neutral input terminals: Must be $> 1\text{M}\Omega$.

### Phase B: Low-Voltage DC External Power Test (Mains Disconnected!)
1. Connect external current-limited DC bench power supply ($5.0\text{V}$, limit $100\text{mA}$) to `+5V_RAW` and `GND_DIGITAL`.
2. Verify regulated `+3.3V_MCU` rail voltage equals $3.30\text{V} \pm 0.05\text{V}$.
3. Verify current draw is $< 30\text{mA}$ with ESP32-S3 in reset state.

### Phase C: ESP32-S3 Firmware Flashing & JTAG Debug
1. Connect USB-C / JTAG cable to ESP32-S3.
2. Flash base bring-up firmware via ESP-IDF toolchain (`idf.py -p COMx flash`).
3. Confirm UART console outputs: `[HIL-MAIN] ESP32-S3 Target Hardware Bring-Up Initialization`.

### Phase D: Peripheral Driver & Relay Verification
1. Command 8 relay GPIOs (`GPIO 4, 5, 6, 7, 15, 16, 17, 18`) sequentially high. Verify audible relay click and $0\Omega$ contact closure across output screw terminals.
2. Probe PCF8563 RTC on I2C bus (`GPIO 1`, `GPIO 2`). Confirm valid date/time response.
3. Read LD2410B mmWave presence sensor over UART (`GPIO 9`, `GPIO 10`). Confirm target range reporting.

### Phase E: High-Voltage Isolated Metrology Calibration
1. Enclose assembly inside IP20 insulated protective barrier.
2. Apply $230.0\text{V RMS}$ isolated AC source to voltage sensing terminals.
3. Execute ADE7953 calibration procedure ($V_{\text{GAIN}}$, $I_{\text{GAIN}}$, $\text{PHCAL}$) and verify error $< 0.5\%$.
