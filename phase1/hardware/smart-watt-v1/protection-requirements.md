# SW-8CH-ESP32-V1 Electrical Protection Requirements & Enclosure Gate

## 1. Electrical Protection Components

1. **Mains Primary Fuse**: $15\text{A}$ Fast-Acting Ceramic Body Fuse ($5 \times 20\text{mm}$, $250\text{V}$, breaking capacity $1500\text{A}$) in series with AC Live input.
2. **Transient Voltage Surge Suppressor**: Metal Oxide Varistor (MOV 14D471K, $470\text{V}$ clamping voltage) across AC Live and Neutral to absorb grid lightning & switching surges.
3. **Inrush NTC Thermistor**: $5\Omega$ NTC Thermistor (MF72-5D11) limiting primary power supply capacitor inrush current.
4. **Relay Flyback Protection**: 1N4148 Schottky diodes across all 8 relay coils to snub inductive voltage spikes.
5. **Brownout Interrupt Circuit**: Hardware voltage divider monitoring +3.3V rail. Triggers ESP32 GPIO 21 interrupt when VDD drops below $2.8\text{V}$, providing $15\text{ms}$ holdup time for NVS energy buffer flush.

---

## 2. Enclosure & Physical Safety Gates

* **Enclosure Rating**: Minimum **IP20** finger-safe flame-retardant ABS/Polycarbonate plastic enclosure (UL 94-V0 rated).
* **Terminal Blocks**: Heavy-duty screw clamp terminals rated for $20\text{A} / 300\text{V}$, accepting 12-14 AWG solid or stranded wire.
* **Mains Safety Prohibition**: Operating or energizing un-enclosed bare PCBs connected directly to AC mains without an isolation transformer is **STRICTLY PROHIBITED**.
