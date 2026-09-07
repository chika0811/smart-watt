# SW-8CH-ESP32-V1 Power Tree & Voltage Rail Distribution

## 1. Power Tree Architecture

```text
[ AC Mains Input: 110-240VAC 50/60Hz ]
                 │
                 ▼ (Mains Fuse & MOV 470V Transient Suppressor)
┌────────────────────────────────────────────────────────┐
│ Primary AC-DC Power Converter (Hi-Link HLK-PM01 / SMPS)│
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
        [ System Unregulated Voltage Rail: 5.0V DC @ 1.0A ]
                         │
        ┌────────────────┴─────────────────────────┐
        │                                          │
        ▼                                          ▼
┌───────────────┐                          ┌───────────────┐
│ Relay Driver  │ (8x 5V Coil Power)       │ Low Drop-Out  │ (AMS1117-3.3 / TLV75533)
│ Power Rail    │                          │ Voltage Reg   │
└───────────────┘                          └──────┬────────┘
                                                  │
                                                  ▼
                                 [ Main Digital Rail: 3.3V DC @ 800mA ]
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                │                                 │                                 │
                ▼                                 ▼                                 ▼
   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
   │ ESP32-S3 Module           │    ┌ PCF8563 RTC IC            │    │ LD2410B mmWave Sensor     │
   │ (Peak RF Transmit: 350mA) │    │ (Backup: CR2032 Battery)  │    │ (Active Current: 80mA)    │
   └───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 2. Power Rail Budget & Peak Current Load Calculations

| Power Rail | Nominal Voltage | Max Load Current | Primary Components Supplied |
| :--- | :--- | :--- | :--- |
| **5.0V Rail** | $5.0\text{V DC} \pm 5\%$ | $850\text{mA}$ | 8x Relay Coils ($8 \times 70\text{mA} = 560\text{mA}$), 3.3V LDO Input |
| **3.3V Digital Rail** | $3.3\text{V DC} \pm 2\%$ | $480\text{mA}$ | ESP32-S3 ($350\text{mA}$ peak), LD2410B ($80\text{mA}$), PCF8563 ($10\text{mA}$), LEDs ($20\text{mA}$) |
| **RTC Backup Rail**| $3.0\text{V DC}$ (CR2032)| $1.5\mu\text{A}$ | PCF8563 SRAM & oscillator during mains outage (5+ year battery life) |
