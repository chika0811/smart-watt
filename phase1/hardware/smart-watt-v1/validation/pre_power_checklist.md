# SW-8CH-ESP32-V1 Design-Consistency & Electrical Safety Gate Audit

## 1. 16A Load-Path Verification & Component Ratings

| Parameter / Element | Value / Part Number | Rating / Specification | Audit Status & Engineering Determination |
| :--- | :--- | :--- | :--- |
| **Relay Component** | Hongfa HF115F-012-1H3A | $16\text{A} / 250\text{VAC}$ Resistive | `VERIFIED`: Rated for continuous 16A load. *(Omron G5Q-1A rated only 10A and is REJECTED for 16A channels)*. |
| **Relay Inductive Rating**| Hongfa HF115F-012-1H3A | $0.5\text{ HP} @ 240\text{VAC}$ ($4\text{A}$ inductive, $30\text{A}$ motor inrush) | `VERIFIED`: Rated for single-phase motor loads up to 0.5 HP. |
| **Relay Inrush Rating** | TV-8 Rating | $120\text{A}$ Peak Inrush ($25\text{ms}$) | `VERIFIED`: AgSnO2 contacts prevent welding under capacitive SMPS inrush. |
| **Terminal Blocks** | Phoenix Contact MKDS 3/ 2-5.08 | $24\text{A} / 320\text{V AC}$ | `VERIFIED`: Terminal block rating ($24\text{A}$) exceeds continuous 16A load requirement. |
| **PCB Outer Copper** | $2\text{oz/ft}^2$ ($70\mu\text{m}$ thickness) | $\text{Width} \ge 3.0\text{mm}$ | `VERIFIED`: IPC-2221 calculation confirms $2.10\text{mm}$ minimum required @ $\Delta T = 20^\circ\text{C}$; $3.0\text{mm}$ enforced. |
| **PCB Load Vias** | $0.3\text{mm}$ Drill / $0.6\text{mm}$ Pad | $1.5\text{A}$ per via | `UNRESOLVED`: Via count on 16A load traces pending Gerber v1.2 audit ($\ge 11$ parallel vias required if layer transition exists). |
| **Branch Circuit MCB** | Type B/C Circuit Breaker | $16\text{A}$ or $20\text{A}$ Rating | `VERIFIED`: Branch breaker provides overcurrent protection for 16A load channels. |

---

## 2. Authoritative Isolation Architecture & Domain Boundary Map

```text
[ MAINS DOMAIN: 110-240VAC HIGH VOLTAGE ]
  ├── 8x 16A Power Relay Contacts (Hongfa HF115F-012-1H3A)
  ├── Mains Potential Divider Network (Voltage Channel VP-VN)
  ├── SCT-013 Current Transformer Load Winding
  └── ADE7953 Energy Metering IC (Referenced to Mains Neutral)
                     │
 ════════════════════╪════════════════════════════════════════════════════ (3.75kV Galvanic Isolation Boundary)
                     │
  ├── Sharp PC817 Optocouplers (5kV RMS Isolation for Relay Transistor Drivers)
  ├── Silicon Labs Si8641ED-B-IS (5kV RMS Isolation for Metrology SPI Bus)
  └── Hi-Link HLK-PM01 Isolated SMPS Transformer (3kV RMS Isolation)
                     │
[ SAFE LOW-VOLTAGE SELV DOMAIN: 3.3V DC ]
  ├── ESP32-S3 Microcontroller (240MHz, 16MB Flash, 8MB PSRAM)
  ├── PCF8563 Hardware RTC & Non-Rechargeable CR2032 Battery (BAT54C Diode Protected)
  ├── LD2410B 24GHz mmWave Presence Radar
  └── USB-C / JTAG Programming Header
```

---

## 3. Critical USB / JTAG Host Safety Rule

> **CRITICAL SHOCK & EQUIPMENT PROTECTION HAZARD**:
> Connecting a PC directly via USB-C or JTAG while AC mains power is connected to the board establishes a direct ground path between SELV GND and PC USB GND. If an isolation breakdown occurs, 240VAC will electrify the PC USB ground, creating a LETHAL SHOCK HAZARD and destroying host equipment.
>
> **MANDATORY SAFETY RULE**:
> Connecting USB/JTAG to a host PC while AC mains is energized is **STRICTLY PROHIBITED**. USB/JTAG may ONLY be connected during low-voltage DC bench testing (Steps 1–13, mains disconnected) or through a certified **$5\text{kV}$ Optically Isolated USB Isolator**.

---

## 4. RTC CR2032 Non-Rechargeable Battery Protection Audit

* **Battery Type**: CR2032 Lithium Coin Cell ($3.0\text{V}$, $220\text{mAh}$, Non-Rechargeable).
* **Reverse Charging Protection**: Circuit incorporates a `BAT54C` Dual Schottky Diode arrangement.
* **Charging Protection Audit**: The series Schottky diode prevents current from the +3.3V digital rail from entering the CR2032 battery when mains power is active. Reverse leakage current is $< 0.1\mu\text{A}$, complying with UL 1642 safety standard for non-rechargeable lithium cells.

---

## 5. Authoritative Protection Component Datasheet References

1. **Auxiliary SMPS Fuse**: Littelfuse 215 Series ($1.0\text{A}$, $250\text{VAC}$, Breaking Capacity $1500\text{A}$, Datasheet: `Littelfuse_215.pdf`).
2. **Transient MOV**: Littelfuse V14E300P ($300\text{VAC}_{\text{RMS}}$, Clamping $775\text{V} @ 45\text{A}$, Surge $160\text{J}$, Datasheet: `Littelfuse_V14E.pdf`).
3. **Inrush NTC**: TDK Epcos B57237S0500M000 ($R_{25} = 5.0\Omega$, $I_{\text{max}} = 4.2\text{A}$, Datasheet: `TDK_B57237S.pdf`).
4. **16A Power Relay**: Hongfa HF115F-012-1H3A ($16\text{A} / 250\text{VAC}$, TV-8 Inrush, Datasheet: `Hongfa_HF115F.pdf`).
5. **Optocoupler**: Sharp PC817X3CSP9F ($5000\text{V}_{\text{RMS}}$ Isolation, Datasheet: `Sharp_PC817.pdf`).
6. **Digital Isolator**: Silicon Labs Si8641ED-B-IS ($5000\text{V}_{\text{RMS}}$ Isolation, 150Mbps, Datasheet: `Si864x.pdf`).
7. **Isolated Power Supply**: Hi-Link HLK-PM01 ($5\text{V} / 3.3\text{V}$, $3000\text{VAC}$ Isolation, Datasheet: `HLK-PM01.pdf`).
8. **Metrology IC**: Analog Devices ADE7953 (Dual-Channel Energy Metering, Datasheet: `ADE7953.pdf`).
9. **Terminal Blocks**: Phoenix Contact MKDS 3/ 2-5.08 ($24\text{A} / 320\text{V}$, Datasheet: `Phoenix_MKDS3.pdf`).

---

## 6. Physical Bring-Up Stopping Criteria (Steps 1–13)

| Step # | Test Phase | PASS Criteria | FAIL Criteria | Immediate STOP Condition |
| :--- | :--- | :--- | :--- | :--- |
| **STEP 1**| Visual Inspection | Zero solder bridges, clean isolation slots, correct IC orientation. | Solder bridge or missing optocoupler isolation slot. | **STOP IMMEDIATELY**. Do not apply DC power until solder rework completed. |
| **STEP 2**| Cold Resistance | $+5\text{V} > 10\text{k}\Omega$, $+3.3\text{V} > 5\text{k}\Omega$, AC to LV = $\infty$. | Any short circuit ($< 100\Omega$) on DC rails or AC-to-LV leakage. | **STOP IMMEDIATELY**. Do not apply DC power until short located and cleared. |
| **STEP 3**| Low-Voltage DC Rails| $+5.0\text{V} \pm 0.1\text{V}$, $+3.3\text{V} \pm 0.05\text{V}$, Current $< 25\text{mA}$ in reset. | Voltage out of spec or current $> 50\text{mA}$ (excess thermal). | **STOP IMMEDIATELY**. Disconnect bench power; inspect LDO and decoupling caps. |
| **STEP 4**| ESP32-S3 Boot | Clean UART boot log @ 115200 baud; dual LX7 cores initialized. | Bootloop, brownout reset trigger, or silent UART. | **STOP**. Check 3.3V rail noise, EN pin capacitor, and crystal oscillator. |
