# NoskyTech Ecosystem — System Overview (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Executive Summary & Revision 4.2 Context

**Phase 0 Revision 4.2** is the final implementation-readiness patch for the NoskyTech Ecosystem architecture. It refines hardware signing contracts, separates bootstrap provisioning credentials from permanent LAN trust credentials, provides explicit rationale for BLE application AEAD, isolates state-transition versioning from observation timestamps, and outlines the 7 Phase 1 technical validation spikes.

### Key Architectural Refinement Summary (Revision 4.2)
1. **Hardware Authentication Contract Precision**:
   - Device authentication SHALL use hardware-backed asymmetric signing supported by the target ESP32 variant's Digital Signature peripheral. For ESP32-S3 targets, RSA-3072 signatures SHALL be evaluated and implemented using the ESP-IDF Digital Signature API and the selected eFuse/HMAC key-protection configuration during the Phase 1B hardware spike.
2. **Bootstrap Credential Lifecycle**:
   - The physical QR code setup secret functions strictly as a **bootstrap credential**. Upon successful device claiming, a permanent replacement LAN trust credential is cryptographically derived and stored in NVS; the QR setup secret is invalidated for standard LAN operation.
3. **BLE Dual-Layer Encryption Rationale**:
   - BLE link-layer encryption (LESC) protects the local BLE transport link; application-layer AEAD protects NDP messages independently of the underlying transport layer.
4. **Sequence Increment Rules (State Transitions vs Observations)**:
   - Logical version `sequence` increments **only upon physical or software state transitions**.
   - Observations of unchanged states (telemetry, periodic heartbeats, status polling) **reuse the current Device Logical Version `(epoch, sequence)`** and report observation timestamps separately.
5. **Phase 1 Validation Spike Roadmap**:
   - Directs initial Phase 1 execution into 7 narrow, technical validation spikes (Phase 1A through 1G) prior to full application development.

---

## 2. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer (Provisional Spike)
        MobileApp["NoskyTech Mobile App (React Native Bare - Provisional)"]
        WebAdmin["NoskyTech Web Dashboard & Admin Console"]
    end

    subgraph Core Application Service Layer
        CommandCoord["Command Coordinator (command_id, correlation_id, coordinator_revision)"]
        AuthZService["Authorization Engine (PostgreSQL RLS & Scope Check)"]
        CypherEngine["Cypher AI Engine (Stale-State Aware Tool Pipeline)"]
    end

    subgraph Transport Management Layer
        TM["Transport Manager (Reachability Evaluator & Socket Handler)"]
        LANTransport["Local Wi-Fi Native Noise_XXpsk2 Socket"]
        BLETransport["BLE LESC Transport (ECDH P-256 / AES-256-GCM)"]
        CloudTransport["Cloud MQTTS Transport (TLS 1.3 / SASL Hardware RSA-3072 DS)"]
    end

    subgraph NoskyTech Cloud Infrastructure
        EMQX["EMQX Enterprise Broker (Redis In-Memory Auth & Topic ACL)"]
        APIGateway["Supabase PostgREST API Gateway & Edge Functions"]
        AuthService["Supabase Auth (JWT Identity Provider)"]
        PostgresDB[(PostgreSQL 15 + RLS + Partitioned Telemetry & Retention Policies)]
    end

    subgraph Hardware Abstraction & Nodes
        HAL["Hardware Abstraction Layer (Generic Endpoint Mapping & Capability Negotiation)"]
        BootGen["Boot Generation Manager (Mirrored NVS Slot A/B)"]
        DSPeripheral["ESP32-S3 Digital Signature Peripheral (ESP-IDF DS API)"]
        SmartWattNode["SMART WATT Node (Product Implementation Layer)"]
    end

    MobileApp --> CommandCoord
    WebAdmin --> APIGateway
    
    CommandCoord --> AuthZService
    AuthZService --> TM
    CypherEngine --> CommandCoord

    TM --> LANTransport
    TM --> BLETransport
    TM --> CloudTransport

    LANTransport --> SmartWattNode
    BLETransport --> SmartWattNode
    CloudTransport --> EMQX

    EMQX <--> APIGateway
    APIGateway --> PostgresDB
    APIGateway --> AuthService

    BootGen --> SmartWattNode
    DSPeripheral --> SmartWattNode
```

---

## 3. Phase 1 Technical Validation Spike Roadmap

Before full production codebase development, Phase 1 executes 7 narrow validation spikes:

```text
Phase 1A: PostgreSQL + RLS Schema Spike
  └── Validate Row Level Security policies, indexes, and tenancy isolation under load.

Phase 1B: ESP32 Secure Identity & DS API Spike
  └── Validate ESP-IDF Digital Signature API with eFuse HMAC key protection on ESP32-S3 hardware.

Phase 1C: Noise_XXpsk2 LAN Transport Spike
  └── Validate Noise transport handshake and frame decryption over local TCP sockets.

Phase 1D: BLE LESC OOB Provisioning Spike
  └── Validate BLE LE Secure Connections ECDH P-256 pairing with OOB setup code.

Phase 1E: EMQX MQTT 5.0 Enhanced SASL Auth Spike
  └── Validate EMQX SASL Enhanced Auth hook against in-memory Redis public key cache.

Phase 1F: Device Logical Version (epoch, sequence) Spike
  └── Validate MCU NVS atomic commits, brownout recovery, and state reconciliation rules.

Phase 1G: React Native Native-Bridge Spike
  └── Validate native C++ Noise/AES socket bridge, mDNS, and background BLE scanning.
```
