# SW-8CH-ESP32-V1 Low-Voltage Bring-Up Execution Protocol (Steps 1–4)

## 1. Step 1: Visual Inspection & SMT Workmanship Audit

* **Condition**: Board unpowered. High-magnification microscope inspection.
* **Target Criteria**:
  * No solder bridges on fine-pitch IC pins (ESP32-S3 module, ADE7953, PCF8563, Si8641).
  * Optocouplers (PC817) and electrolytic capacitors correctly oriented according to schematic polarity.
  * Isolation milled slots clean of solder flux, copper burrs, or metallic debris.

```text
[TEST ID: BRINGUP-STEP-01]
Result: NOT EXECUTED — BENCH ATTACHMENT REQUIRED
Operator Notes: Physical SW-8CH-ESP32-V1 PCB prototype pending attachment to lab bench microscope workstation.
```

---

## 2. Step 2: Unpowered Cold Resistance & Short-Circuit Audits

* **Condition**: Digital Multimeter (DMM) in Resistance ($\Omega$) mode.
* **Target Criteria**:
  1. `+5V_RAW` to `GND_DIGITAL`: $> 10\text{k}\Omega$ (No short circuit).
  2. `+3.3V_MCU` to `GND_DIGITAL`: $> 5\text{k}\Omega$ (No short circuit).
  3. `V_CR2032` to `GND_DIGITAL`: $> 100\text{k}\Omega$ (No battery drain short).
  4. AC Live input to AC Neutral input: $> 1\text{M}\Omega$.
  5. AC Live input to `GND_DIGITAL` (LV SELV): $\infty$ (Open circuit, isolation barrier verified).

```text
[TEST ID: BRINGUP-STEP-02]
Result: NOT EXECUTED — BENCH ATTACHMENT REQUIRED
Operator Notes: Physical DMM probe measurements required on assembled PCB test points TP1, TP2, TP3.
```

---

## 3. Step 3: Low-Voltage DC Power Rail Verification (Mains Disconnected)

* **Condition**: External DC Bench Power Supply ($5.0\text{V}$, current limit $100\text{mA}$) connected to `TP2 (+5V_RAW)` and `TP1 (GND_DIGITAL)`. AC Mains disconnected.
* **Target Criteria**:
  1. `+5V_RAW` Rail Voltage: $4.95\text{V} - 5.05\text{V DC}$.
  2. `+3.3V_MCU` Regulated LDO Output: $3.27\text{V} - 3.33\text{V DC}$.
  3. Total Supply Current (ESP32-S3 held in Reset): $< 25\text{mA}$.

```text
[TEST ID: BRINGUP-STEP-03]
Result: NOT EXECUTED — BENCH ATTACHMENT REQUIRED
Operator Notes: Requires bench DC power supply attachment and DMM voltage logging.
```

---

## 4. Step 4: ESP32-S3 Bootloader & JTAG Console Verification

* **Condition**: ESP32-S3 connected via USB-C JTAG interface. Firmware flashed via ESP-IDF toolchain.
* **Target Criteria**:
  1. ESP32-S3 boots cleanly without brownout reset loop.
  2. UART console outputs: `[HIL-MAIN] ESP32-S3 Target Hardware Bring-Up Initialization`.
  3. Both Xtensa LX7 CPU cores running @ 240MHz with 16MB Flash and 8MB PSRAM detected.

```text
[TEST ID: BRINGUP-STEP-04]
Result: NOT EXECUTED — BENCH ATTACHMENT REQUIRED
Operator Notes: Requires USB JTAG flash and UART console log capture.
```
