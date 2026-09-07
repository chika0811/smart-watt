# NoskyTech Ecosystem — API Architecture Specification (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & API Principles

The NoskyTech Ecosystem exposes RESTful and Real-Time (WebSocket/MQTT) APIs.

### Key API Principles
1. **Resource Authorization**: All routes require JWT Bearer authentication and evaluate Home tenancy permissions via RLS policies.
2. **Command Coordinator Dispatch**: Mutation requests route through `CommandCoordinator` using `command_id` and `correlation_id`.
3. **Idempotency**: All mutation requests accept an `X-Idempotency-Key` header.
4. **Standard Error Schema**: Errors adhere strictly to RFC 7807 Problem Details.

---

## 2. API Endpoints

### 2.1 Capability Command Dispatch (`POST /api/v1/commands/dispatch`)

#### Request Payload
```json
{
  "homeId": "550e8400-e29b-41d4-a716-446655440000",
  "applianceId": "771e8400-e29b-41d4-a716-446655441111",
  "abstractCapability": "power",
  "desiredValue": false,
  "ttlSeconds": 10
}
```

#### Response Payload (HTTP 200 OK)
```json
{
  "commandId": "cmd_9901_8821_1234",
  "correlationId": "corr_1102_9981_0044",
  "coordinatorRevision": 1042,
  "status": "CONFIRMED",
  "transportUsed": "LAN_NOISE_PSK",
  "reportedState": {
    "power": false
  },
  "qualityStatus": "FRESH"
}
```

### 2.2 Cypher Natural Language API (`POST /api/v1/cypher/chat`)
- Input: User natural language prompt + `homeId`.
- Output: Cypher text response (stale-state aware) + executed tool actions summary.
