# Phase 1G Unresolved Risks & Hardware Limitations Log

## 1. Identified Risks & Mitigation Strategies

1. **High Inrush Current Relay Contact Welding**:
   * *Risk*: Capacitive switch-mode power supplies can draw $80\text{A}+$ peak inrush current, risking contact welding on standard power relays.
   * *Mitigation*: Hardware revision `SW-8CH-ESP32-V1` uses high-inrush 16A relays (Omron G5Q / Hongfa HF115F with TV-8 inrush rating).
2. **Thermal Dissipation under 8x 16A Full Load**:
   * *Risk*: Enclosure thermal buildup when multiple relays carry high continuous current.
   * *Mitigation*: PCB copper pour area expanded to $2\text{oz/ft}^2$ thick copper on high-current tracks with thermal relief vias.
3. **Mains High-Voltage Safety Enclosure Gate**:
   * *Risk*: Accidental contact during physical bench testing.
   * *Mitigation*: All high-voltage testing requires IP20 insulated housing, 3.75kV galvanic isolation barrier, and isolated differential probes.

---

## 2. Blockers & Conditions

* **BLOCKERS**: **NONE**. All Phase 1A through 1F contracts remain intact and validated.
* **CONDITIONS**: Final physical lab bench signoff under 240VAC 16A continuous load is required prior to mass production tooling.
