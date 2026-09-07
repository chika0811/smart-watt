# SW-8CH-ESP32-V1 Relay Driver Interface Specification

## 1. Electrical Schematic Interface

Each of the 8 relay channels uses an optocoupler-isolated driver circuit:

```text
ESP32 GPIO Output (3.3V) ──[ 220Ω ]──> (Pin 1 PC817 Optocoupler LED)
                                       (Pin 2 PC817 LED -> GND)
                                                   │ (Galvanic Isolation Barrier)
                                                   ▼
+5V Rail ──[ 1kΩ ]── (Pin 4 Photo-Transistor Collector)
                     (Pin 3 Photo-Transistor Emitter) ──[ 1kΩ ]──> NPN Transistor Base (S8050)
                                                                  NPN Collector ──> Relay Coil (-)
                                                                  +5V Rail ────────> Relay Coil (+)
                                                                  Flyback Diode (1N4148) in parallel with Coil
```

---

## 2. Relay Ratings & Specifications

* **Relay Component**: Omron G5Q-1A / Hongfa HF115F-012-1H3A.
* **Coil Nominal Voltage**: $5\text{V DC}$ ($70\text{mA}$ per coil).
* **Contact Configuration**: Single Pole Single Throw Normally Open (SPST-NO).
* **Maximum Switching Voltage**: $250\text{VAC} / 30\text{VDC}$.
* **Continuous Rated Current**: $16\text{A}$ resistive @ $250\text{VAC}$.
* **Inrush Current Rating**: $80\text{A}$ peak ($20\text{ms}$) compliant with TV-8 inrush standard.
* **Control Logic**: **Active-High Logic** (GPIO High = Optocoupler ON = Transistor ON = Relay Contact Closed / ON).

---

## 3. Safe Startup & Boot State Enforcement

1. **Hardware Pull-Down Resistors**: Every relay GPIO (`GPIO 4, 5, 6, 7, 15, 16, 17, 18`) contains a physical $10\text{k}\Omega$ external pull-down resistor to GND.
2. **Boot Behavior**: During ESP32 bootloader execution and hardware reset, GPIO outputs float in high-impedance mode; external pull-downs guarantee that optocouplers remain OFF ($0.0\text{V}$), preventing relay activation during boot.
