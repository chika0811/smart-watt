# SW-8CH-ESP32-V1 Physical Prototype Bring-Up & Hardware Validation Package

## 1. Executive Summary & Objective

This validation package governs the physical laboratory bring-up, safety evaluation, electrical calibration, and Hardware-in-the-Loop (HIL) testing for the **Smart Watt Hardware Revision SW-8CH-ESP32-V1**.

### Core Governance Rule
> **PHYSICAL EVIDENCE DETERMINES ACCEPTANCE**:
> Software simulations, host test passes, and ESP-IDF compilation successes **DO NOT** constitute physical hardware validation. No test may be marked `PHYSICAL-HARDWARE-VALIDATED` without real bench measurements recorded from assembled physical hardware. If physical bench instrumentation is not connected, the test MUST be marked `NOT EXECUTED — BENCH ATTACHMENT REQUIRED` or `HARDWARE-VALIDATION-PENDING`.

---

## 2. 14-Step Safe Bring-Up Execution Protocol

Bring-up must follow this exact sequential order without skipping safety gates:

```text
STEP 1: Visual Inspection & SMT Workmanship Audit
    ↓
STEP 2: Cold Resistance & Short-Circuit Audits (Unpowered)
    ↓
STEP 3: Low-Voltage DC Rail Verification (Mains Disconnected)
    ↓
STEP 4: ESP32-S3 Bootloader & JTAG Console Verification
    ↓
STEP 5: ESP32-S3 eFuse & Hardware DS Identity Verification
    ↓
STEP 6: BLE LESC OOB Provisioning Verification
    ↓
STEP 7: Customer Wi-Fi Provisioning & NVS Credential Storage
    ↓
STEP 8: Hardware RTC (PCF8563) & Battery Backup Verification
    ↓
STEP 9: 8-Channel Relay Driver Low-Voltage Actuation Tests
    ↓
STEP 10: LD2410B mmWave Presence Sensor UART Verification
    ↓
STEP 11: ADE7953 Isolated SPI Metrology Calibration (Safe Isolated Source)
    ↓
STEP 12: VDD Brownout ISR & Double-Buffered NVS Recovery
    ↓
STEP 13: End-to-End System Offline & Reconnect Workflow Test
    ↓
STEP 14: Controlled High-Voltage Mains Testing (Post Safety Review Only)
```

---

## 3. Package Structure

```text
phase1/hardware/smart-watt-v1/validation/
├── README.md                          # Bring-up package governance & sequence
├── pre_power_checklist.md             # Hard Safety Gate, component selection rationale, creepage calculations
├── low_voltage_bringup.md             # Steps 1–4: Inspection, short-circuit checks, DC rails, ESP32 boot
├── esp32_identity_test.md             # Step 5: eFuse key block & DS hardware peripheral verification
├── wifi_ble_test.md                   # Steps 6–7: BLE LESC OOB & zero-hardcoded customer Wi-Fi tests
├── rtc_test.md                        # Step 8: PCF8563 RTC, CR2032 backup, & drift measurement
├── relay_test.md                      # Step 9: 8-channel low-voltage relay driver actuation tests
├── metrology_calibration.md          # Step 11: ADE7953 3-point physical calibration (V_GAIN, I_GAIN, PHCAL)
├── presence_test.md                   # Step 10: LD2410B mmWave presence & version non-increment tests
├── power_failure_test.md              # Step 12: VDD brownout ISR & Slot B NVS recovery tests
├── end_to_end_test.md                 # Step 13: 21-step master system offline workflow test
├── measurement_log.md                 # Physical instrument measurement records & calibration logs
├── failure_log.md                     # Hardware anomaly & defect tracking log
└── physical-validation-report.md      # Final validation audit report (Validated, Pending, Production Blockers)
```
