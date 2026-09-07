# ADR-011: Native ESP-IDF Secure Boot V2 OTA Architecture & Anti-Rollback (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Deploying over-the-air firmware updates to physical hardware in consumer homes requires zero risk of bricking devices, protection against binary tampering, and anti-rollback protection to prevent downgrade attacks.

## 2. Alternatives Evaluated
1. **ESP-IDF Native Secure Boot V2 Dual-Partition (ota_0 / ota_1) RSA-3072 PSS [FINAL SELECTION]**: Dual flash layout with native ESP32-S3 RSA-3072 PSS signature verification, eFuse security-version anti-rollback gate, and bootloader watchdog.
2. **Single Flash Partition Overwrite**: Flashing directly over active operating partition.
3. **Differential Binary Patching**: Delta patching existing flash partitions.

## 3. Selected Approach & Technical Reason
We select **ESP-IDF Native Secure Boot V2 Dual-Partition RSA-3072 PSS with eFuse Anti-Rollback**. Flashing passive partition `ota_1` while running active partition `ota_0` guarantees zero risk of bricking devices during power loss during firmware downloads. RSA-3072 PSS signatures and eFuse security-version gates prevent binary tampering and downgrade exploits.

## 4. Operational Consequences
- **Positive**: Zero risk of bricked devices; cryptographic tamper protection; automated 120s rollback watchdog; hardware anti-rollback downgrade security.
- **Negative**: Requires 4MB minimum SPI Flash size on hardware.

## 5. Migration Consequences
Dual-partition table standard across all ESP-IDF hardware platforms.
