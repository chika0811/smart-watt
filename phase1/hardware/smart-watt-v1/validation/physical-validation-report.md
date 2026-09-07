# SW-8CH-ESP32-V1 Design Consistency & Physical Bring-Up Gate Audit

## 1. DESIGN BLOCKERS

* **`DB-01: USB/JTAG Direct PC Connection Mains Hazard`**: Direct connection of a host PC via USB-C or JTAG while AC mains power is energized creates a direct ground path to SELV GND, introducing a lethal shock hazard if isolation breakdown occurs. USB/JTAG connection to host PC is **STRICTLY PROHIBITED** during energized testing unless a $5\text{kV}$ Optically Isolated USB Isolator is used.
* **`DB-02: Enclosure Protection Gate`**: High-voltage AC mains testing (Step 14) is **STRICTLY PROHIBITED** until the assembled prototype PCB is housed inside an IP20 finger-safe UL 94-V0 flame-retardant plastic enclosure.

---

## 2. UNRESOLVED ENGINEERING ITEMS

* **`UEI-01: PCB Load Trace Via Count`**: If 16A load traces transition between top and bottom copper layers, the via count must be verified against Gerber v1.2 files ($\ge 11$ parallel $0.3\text{mm}$ vias required to carry 16A continuous).
* **`UEI-02: Physical Creepage & Clearance Measurement`**: Physical creepage distance ($\ge 6.0\text{mm}$) along FR4 board surface and clearance air gap ($\ge 3.0\text{mm}$) must be measured under microscope on physical Gerber v1.2 prototypes.

---

## 3. VERIFIED ITEMS

* **`VI-01: Relay 16A Contact Rating`**: Hongfa HF115F-012-1H3A selected and verified rated for 16A resistive @ 250VAC, 0.5 HP motor load, and TV-8 peak inrush ($120\text{A}$). *(Omron G5Q-1A rated 10A rejected)*.
* **`VI-02: Inrush Peak Calculation`**: Cold peak inrush current recalculated as **$67.88\text{A}_{\text{peak}}$ @ $240\text{V}_{\text{RMS}}$ ($339.4\text{V}_{\text{peak}}$)** and **$74.67\text{A}_{\text{peak}}$ @ $264\text{V}_{\text{RMS}}$ ($373.4\text{V}_{\text{peak}}$)**. Primary bulk capacitor energy ($0.697\text{J}$) verified within NTC $2.1\text{J}$ energy absorption capacity.
* **`VI-03: MOV Overvoltage Protection`**: MOV upgraded to **Littelfuse V14E300P ($300\text{V}_{\text{RMS}}$)**, providing a continuous $24\text{V}$ safety buffer over maximum $+15\%$ grid overvoltage ($276\text{VAC}_{\text{RMS}}$).
* **`VI-04: Terminal Block Rating`**: Phoenix Contact MKDS 3/ 2-5.08 terminal blocks verified rated for $24\text{A} / 320\text{V AC}$, exceeding 16A load requirement.
* **`VI-05: IPC-2221 PCB Trace Calculation`**: Verified minimum $2.10\text{mm}$ trace width required for 16A on $2\text{oz}$ copper @ $\Delta T = 20^\circ\text{C}$; $3.0\text{mm}$ trace width enforced in design.
* **`VI-06: Non-Rechargeable CR2032 Diode Protection`**: Verified reverse charging protection for non-rechargeable CR2032 coin cell using `BAT54C` Schottky blocking diode (UL 1642 compliant).
* **`VI-07: Galvanic Isolation Map`**: Authoritative 3.75kV / 5kV isolation boundary map established separating Mains domain (relays, ADE7953) from SELV domain (ESP32-S3, RTC, presence).

---

## 4. STEP 1 AUTHORIZATION: YES

---

## 5. EXACT REASON

All low-voltage design calculations, component selection ratings, isolation boundaries, USB safety rules, and physical stopping criteria have been mathematically verified. Physical prototype PCB `SW-8CH-ESP32-V1` is authorized for **STEP 1 (Visual Inspection)** and **STEP 2 (Unpowered Cold Resistance Audits)** on the laboratory bench with **AC mains power completely disconnected**.
