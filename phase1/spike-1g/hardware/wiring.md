# Smart Watt Electrical Safety Isolation & Wiring Specification

## 1. High-Voltage Mains & Low-Voltage Isolation Architecture

```text
[ Mains High-Voltage Domain: 110-240VAC L / N ]
                   │
    ┌──────────────┴──────────────┐
    │ High-Voltage Relay Contacts │ (8x 16A Relays: HF115F / G5Q)
    └──────────────┬──────────────┘
                   │
 ══════════════════╪════════════════════════════════════════════════════════ (Galvanic Isolation Barrier)
                   │
    ┌──────────────┴──────────────┐
    │ 3.75kV Optocouplers (PC817) │ (Galvanic Isolation for Relay Transistor Drivers)
    └──────────────┬──────────────┘
                   │
 ══════════════════╪════════════════════════════════════════════════════════ (Galvanic Isolation Barrier)
                   │
    ┌──────────────┴──────────────┐
    │ Isolated SPI (Si8641 / ADuM)│ (Galvanic Isolation for Metrology IC ADE7953)
    └──────────────┬──────────────┘
                   │
[ ESP32-S3 Microcontroller Low-Voltage Digital Domain: 3.3V DC ]
```

---

## 2. Safety Standard & PCB Trace Separation Rules

* **Applicable Standards**: Compliance with **IEC/EN 61010-1**, **IEC/EN 60664-1**, **UL 60730-1**, and **IEC 62368-1**.
* **Overvoltage Category (OVC)**: OVC II (Mains Power Distribution / Wall Socket Load Node).
* **Pollution Degree**: Pollution Degree 2 (Unsealed Indoor Enclosure).
* **PCB Material**: FR4 Substrate with Comparative Tracking Index $\text{CTI} \ge 175$ (Group IIIa).
* **Isolation Withstand Voltage**: $\ge 3.75\text{kV RMS}$ ($5\text{kV}$ impulse surge withstand).
* **Minimum Physical PCB Spacing**:
  * **Reinforced Insulation Creepage Distance**: $\ge 6.0\text{mm}$ along PCB surface.
  * **Reinforced Insulation Clearance Distance**: $\ge 3.0\text{mm}$ through air.
  * **Internal Layer Separation**: $\ge 0.4\text{mm}$ solid insulation thickness.
* **PROHIBITION**: Exposing mains high voltage directly to ESP32 ADC pins is **STRICTLY PROHIBITED**.
