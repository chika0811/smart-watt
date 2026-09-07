# NoskyTech Ecosystem — Master Architecture Specification (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Core Architectural Principles (Revision 4.2)

The NoskyTech Ecosystem is a local-first, multi-tenant smart-device platform designed for fault tolerance, cryptographic security, and mathematical state consistency.

### Architectural Imperatives
1. **Domain Isolation of Identifiers vs Versioning**:
   - `command_id` (UUIDv4): Globally unique command identity.
   - `correlation_id` (UUIDv4): End-to-end request/response tracing.
   - `coordinator_revision` (uint64): Monotonic ordering of dispatches issued by `CommandCoordinator`.
   - `device_state_version` `(epoch, sequence)`: Device state version tuple.
   - `message_id` (UUIDv4): Network-level packet duplicate detection.
   - **PROHIBITION**: `coordinator_revision` and `device_state_version` belong to different domains. Direct numerical comparison between them is strictly prohibited by protocol.
2. **State-Transition Versioning vs Observation Timestamps**:
   - Monotonic `sequence` is incremented **only upon physical or software state transitions** (`relay ON → OFF`).
   - Observations of unchanged states (telemetry polling, periodic heartbeats) **reuse the active Device Logical Version `(epoch, sequence)`** and report observation timestamps (`last_reported_at`) separately.
3. **Hardware Authentication Contract**:
   - Device authentication SHALL use hardware-backed asymmetric signing supported by the target ESP32 variant's Digital Signature peripheral. For ESP32-S3 targets, RSA-3072 signatures SHALL be evaluated and implemented using the ESP-IDF Digital Signature API and the selected eFuse/HMAC key-protection configuration during the Phase 1B hardware spike.

---

## 2. Formal Device State Versioning Specification `(epoch, sequence)`

Device endpoint state ordering is governed by the version tuple:

$$V = (\text{epoch}, \text{sequence})$$

### 2.1 Boot Generation Manager & Crash Window Definition

```text
Boot Generation Manager (Microcontroller NVS)
├── Slot A: BootRecord { generation: uint32, complement: uint32, crc32: uint32 }
└── Slot B: BootRecord { generation: uint32, complement: uint32, crc32: uint32 }
```

#### Execution Sequence & Crash Window Lifecycle
1. **Receive Command**: MCU parses inbound NDP command frame (`desired_value`).
2. **State Actuation**: Physical relay gate or software endpoint toggled.
3. **Atomic NVS Commit**: MCU commits new endpoint state, `active_epoch`, and incremented `sequence = sequence + 1` to wear-leveled NVS.
4. **Network ACK**: MCU emits execution ACK frame to network client.

#### Crash Window Analysis
- **Crash before Step 3 (Actuated but not committed to NVS)**: Upon power restoration, Boot Generation Manager increments $\text{epoch} = \text{epoch} + 1$, resets $\text{sequence} = 0$, and reads the last durable state from NVS. The MCU emits an updated status report $V_{\text{new}} = (\text{epoch} + 1, 0) > V_{\text{old}} = (\text{epoch}, \text{seq}_{\text{old}})$, resolving state to last durable value.
- **Crash after Step 3 (Committed to NVS but ACK lost)**: MCU reboots into $\text{epoch} + 1$. Client re-queries or re-dispatches; MCU evaluates version $V_{\text{new}} > V_{\text{client}}$ and safely reconciles.

---

## 3. Command Coordinator & Envelope Model

### 3.1 Command Contract Structure
```json
{
  "command_id": "c71e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "110e8400-e29b-41d4-a716-446655441111",
  "coordinator_revision": 1042,
  "target_device_id": "550e8400-e29b-41d4-a716-446655440000",
  "endpoint_id": "relay_3",
  "desired_value": false,
  "issued_at": 1756312400,
  "expires_at": 1756312410
}
```

### 3.2 End-to-End Command Dispatch Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Mobile App / Cypher
    participant CC as Command Coordinator
    participant AuthZ as Authorization Service
    participant TM as Transport Manager
    participant Dev as Physical Device Endpoint

    User->>App: Action Request (Turn off Kitchen Light)
    App->>CC: dispatchCommand(homeId, applianceId, capability, desiredValue)
    CC->>CC: Generate command_id & correlation_id; increment coordinator_revision
    CC->>AuthZ: Validate User Authorization for homeId & applianceId
    AuthZ-->>CC: Authorization CONFIRMED (Role: Member)
    
    CC->>TM: executePayload(command_id, correlation_id, coordinator_revision, dev_id, endpoint_id, payload)
    
    alt Local LAN Active (Native Noise_XXpsk2)
        TM->>Dev: Noise Encrypted Socket Frame
    else Cloud Fallback
        TM->>Dev: Cloud MQTT Packet (QoS 1)
    else BLE Fallback
        TM->>Dev: BLE GATT Write (AES-256-GCM)
    end

    Dev->>Dev: Execute State Change -> Increment sequence = sequence + 1
    Dev->>Dev: Atomically Commit State & Sequence to NVS
    Dev-->>TM: ACK Frame (command_id, correlation_id, epoch, sequence, status: EXECUTED)
    TM-->>CC: ACK Packet Delivered
    CC->>CC: Mark command_id CONFIRMED -> Resolve Promise
    CC-->>App: Command Confirmed -> Update Authoritative UI State
```

---

## 4. Hardware State Decoupling Model

To eliminate confusion between user intent, physical switches, software commands, and relay outputs, the architecture explicitly isolates five distinct state layers:

```text
[ Physical Input ] (Wall Switch / Optocoupled Button)
        │  (Triggers GPIO Interrupt)
        ▼
[ Software Command ] (Local Switch Handler OR Remote NDP v1 Command Frame)
        │  (Validates Command & Executes Relay Gate)
        ▼
[ Output Hardware State ] (Physical Relay / MOSFET Output Gate)
        │  (Senses Pin State via Optocoupled Feedback Loop)
        ▼
[ Reported Endpoint State ] (MCU State Buffer: epoch, sequence, reported_value)
        │  (Emitted via Telemetry / ACK Frame)
        ▼
[ External Appliance State ] (Logical Combined State of Bound Endpoints in App UI)
```
