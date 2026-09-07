# Phase 1G System Audit: Real vs Simulated Validation Boundary

## 1. Classification Methodology

To ensure absolute transparency and prevent premature claims of physical hardware validation, every subsystem in the Smart Watt platform is classified into **exactly one** of the following validation levels:

1. **`SIMULATED`**: Algorithmic logic or mock protocol execution in host environment (e.g. Node.js or JavaScript test suite).
2. **`HOST-VALIDATED`**: Native C++ or C implementation compiled and tested on x86/x64 host machine (e.g. OpenSSL/Crypto, native C++ main executable).
3. **`ESP-IDF-BUILD-VALIDATED`**: C/C++ firmware code compiled against ESP-IDF v5.x toolchain (`idf.py build`) producing valid ELF/binaries for ESP32-S3.
4. **`PHYSICAL-HARDWARE-VALIDATED`**: Flash execution on physical ESP32-S3 silicon connected to actual physical sensors, relays, metrology ICs, and lab reference equipment.
5. **`PRODUCTION-READY`**: Mass-production toolroom hardware, certified IP-rated enclosure, and safety lab NRTL certification.

---

## 2. Explicit Subsystem Validation Level Audit

| Subsystem / Feature | Current Validation Level | Description & Status | Firmware vs Physical Hardware Distinction |
| :--- | :--- | :--- | :--- |
| **RSA-3072 DS Peripheral** | `ESP-IDF-BUILD-VALIDATED` | Firmware C++ calls `esp_ds_sign()` API compiled for ESP32-S3. | **Firmware driver compiled.** Physical eFuse key burning & DS hardware timing pending bench attached ESP32-S3. |
| **BLE LESC OOB Provisioning** | `HOST-VALIDATED` | LESC ECDH + 256-bit QR setup secret handshake verified in Node/Host. | **Protocol verified on host.** Physical NimBLE / Bluedroid BLE stack RF advertising & phone GATT scan pending physical hardware. |
| **Customer Wi-Fi Provisioning**| `HOST-VALIDATED` | Zero hardcoded SSID/passwords; NVS encrypted credential save/restore verified. | **Credential lifecycle verified.** Physical ESP32-S3 802.11 b/g/n RF connection to customer AP pending bench test. |
| **Noise LAN Transport** | `HOST-VALIDATED` | `Noise_XX_25519_ChaChaPoly_BLAKE2b` transport verified in C++/Node. | **Noise engine verified.** Physical IP socket packet transfer over Wi-Fi AP pending bench test. |
| **MQTT 5 Enhanced Auth** | `HOST-VALIDATED` | SASL RSA-3072 PSS transcript signing & Redis/DB ACL scope verified. | **SASL state machine verified.** Physical TLS 1.3 socket to EMQX broker over ESP32 Wi-Fi pending bench test. |
| **PCF8563 Hardware RTC** | `ESP-IDF-BUILD-VALIDATED` | C++ I2C driver (`hil_drivers.cpp`) compiled for ESP32-S3. | **Firmware driver compiled.** Physical I2C bus signals & battery backup retention pending PCF8563 IC hardware bench. |
| **8 Relay Outputs** | `ESP-IDF-BUILD-VALIDATED` | C++ 8-channel GPIO driver with active-high optocoupler control compiled. | **Firmware driver compiled.** Physical GPIO voltage levels & relay contact switching pending physical driver PCB. |
| **ADE7953 Voltage Sensing** | `ESP-IDF-BUILD-VALIDATED` | C++ isolated SPI Vrms sampling driver compiled for ESP32-S3. | **Firmware driver compiled.** Physical SPI voltage sampling from isolated transformer pending bench AC source. |
| **ADE7953 Current Sensing** | `ESP-IDF-BUILD-VALIDATED` | C++ isolated SPI Irms sampling driver for 1 total current channel compiled. | **Firmware driver compiled.** Physical CT sensor sampling & calibration pending bench AC load test. |
| **Power & PF Calculation** | `HOST-VALIDATED` | $S = V \cdot I$, $P = V \cdot I \cdot \cos\theta$, $\text{PF} = P/S$ math validated in C++. | **Algorithm verified.** Physical non-linear load phase angle measurement pending lab bench test. |
| **Energy Accumulation** | `HOST-VALIDATED` | $E = \int P \, dt$ integration & 15-min NVS buffer flush validated in C++. | **Engine verified.** Continuous physical energy accumulation vs Fluke reference meter pending lab bench test. |
| **Per-Output Current Sensing**| `ESP-IDF-BUILD-VALIDATED` | Software advertises `per_output_current: false` (SW-8CH-ESP32-V1 hardware spec).| **Contract enforced.** Hardware contains 1 total current sensor, NOT 8 independent sensors. |
| **LD2410B Presence Sensing** | `ESP-IDF-BUILD-VALIDATED` | C++ UART driver & presence state normalization compiled. | **Firmware driver compiled.** Physical mmWave radar distance & human detection pending sensor hardware bench. |
| **Double-Buffered NVS** | `HOST-VALIDATED` | Dual-slot A/Bwear leveling, CRC32, and Slot B recovery verified in C++. | **Persistence engine verified.** Physical flash sector endurance & wear leveling over 100k cycles pending lab stress test. |
| **Brownout Recovery** | `ESP-IDF-BUILD-VALIDATED` | C++ brownout ISR handler & VDD interrupt hook compiled. | **ISR logic compiled.** Physical DC supply brownout power drops pending programmable DC power supply. |
| **Offline Local Automation** | `HOST-VALIDATED` | Cypher rule compilation, local RTC evaluation, & zero-cloud execution verified. | **State engine verified.** End-to-end execution on physical ESP32-S3 with Wi-Fi AP powered off pending bench test. |

---

## 3. Mandatory Summary Statement

> **CRITICAL ARCHITECTURAL DISTINCTION**:
> The software, firmware C++ drivers, protocols, and version state engines for Smart Watt are fully implemented and **HOST-VALIDATED / ESP-IDF-BUILD-VALIDATED**. However, no subsystem is classified as `PHYSICAL-HARDWARE-VALIDATED` or `PRODUCTION-READY` until the firmware is flashed to assembled physical `SW-8CH-ESP32-V1` PCBs and tested against calibrated electrical reference equipment.
