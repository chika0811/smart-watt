# SW-8CH-ESP32-V1 Galvanic Isolation Boundary & Creepage / Clearance Specification

## 1. PCB Isolation Barrier Topology

```text
[ HIGH-VOLTAGE MAINS DOMAIN: 110-240VAC L / N ]
  ├── 8x 16A Relay Contacts
  ├── Mains Potential Divider Network
  └── SCT-013 Current Transformer Input
                     │
 ════════════════════╪════════════════════════════════════════ (Galvanic Isolation Barrier: 3.75kV RMS)
                     │
  ├── PC817 Optocouplers (Relay Drivers)
  ├── Si8641 Digital SPI Isolator (ADE7953 Metrology IC)
  └── Isolated SMPS Power Supply Transformer
                     │
[ LOW-VOLTAGE DIGITAL DOMAIN: 3.3V DC ]
  ├── ESP32-S3 Microcontroller
  ├── PCF8563 Hardware RTC
  └── LD2410B mmWave Radar Sensor
```

---

## 2. Safety Distance Standards & Parameters

* **Applicable Standards**: Compliance with **IEC/EN 61010-1**, **IEC/EN 60664-1**, **UL 60730-1**, and **IEC 62368-1**.
* **Overvoltage Category (OVC)**: OVC II (Mains power distribution wall socket load node).
* **Pollution Degree**: Pollution Degree 2 (Unsealed indoor protective enclosure).
* **PCB Substrate Material**: FR4, Comparative Tracking Index $\text{CTI} \ge 175$ (Material Group IIIa).
* **Isolation Withstand Rating**: $\ge 3.75\text{kV RMS}$ ($5\text{kV}$ impulse surge withstand for 1 minute).
* **Creepage Distance**: $\ge 6.0\text{mm}$ along PCB surface between High Voltage and Low Voltage copper traces.
* **Clearance Distance**: $\ge 3.0\text{mm}$ through air gap between High Voltage and Low Voltage components.
* **Isolation Slots**: $2.0\text{mm}$ milled PCB physical air slots under optocouplers and SPI digital isolator.
