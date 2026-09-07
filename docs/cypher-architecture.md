# NoskyTech Ecosystem — Cypher AI Security Specification (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & Architectural Isolation Rules

**Cypher** is the intelligent natural language assistant for the NoskyTech Ecosystem.

### Mandatory Execution Path
Natural language interactions with hardware MUST strictly traverse the following sequential pipeline:

```text
User Natural Language Input
        ↓
AI Intent Parsing & Argument Extraction
        ↓
  ├── Direct Command Execution Pipeline (Real-Time Actuation)
  └── Typed Automation Rule Generation Pipeline (RTC / Schedule Installation)
        ↓
Server-Side Authorization (RBAC Verification of initiating user in target home_id)
        ↓
Typed Tool Invocation (Validating JSON Schema Parameters)
        ↓
Command Coordinator (Assigning command_id, correlation_id, and coordinator_revision)
        ↓
Transport Manager (Evaluating Reachability & Socket Dispatch)
        ↓
Physical Microcontroller Hardware Endpoint (NVS Store for Local RTC Engine Execution)
```

---

## 2. Typed Automation Rule Translation (RTC & Schedules)

When a user issues natural language scheduling requests (e.g., *"Turn on the bulb at 7 AM and turn it off at 12 PM"*), Cypher DOES NOT execute a continuously polling cloud execution loop.

Instead, Cypher converts the request into a **Typed Automation Rule**:

```json
{
  "rule_id": "rule-7744-8899",
  "name": "Bulb Schedule 07:00-12:00",
  "triggers": [
    {"type": "TIME_RTC", "cron": "0 7 * * *", "target_state": {"relay_1": true}},
    {"type": "TIME_RTC", "cron": "0 12 * * *", "target_state": {"relay_1": false}}
  ],
  "conditions": [],
  "actions": [
    {"endpoint_id": "relay_1", "capability": "power"}
  ]
}
```

### Execution Guarantee
1. Cypher compiles the typed JSON rule schema.
2. `CommandCoordinator` authenticates and dispatches the rule frame to the target Smart Watt device.
3. The MCU commits the rule to wear-leveled NVS.
4. The local RTC + Automation Engine executes the schedule offline independently of cloud or Cypher uptime.

---

## 3. Stale-State Awareness & Query Resolution

Cypher MUST NOT present unconfirmed or stale data as active state. When querying appliance state, Cypher receives a full state quality payload:

```json
{
  "appliance_name": "Living Room Air Conditioner",
  "reported_value": "ON",
  "quality_status": "STALE",
  "last_seen_seconds_ago": 1020,
  "data_source": "CACHED_POSTGRES"
}
```

### Cypher Response Semantics
- **If `quality_status == 'FRESH'`**: "The Living Room AC is ON."
- **If `quality_status == 'STALE'`**: "The Living Room AC was reported ON 17 minutes ago, but the device is currently unreachable."
- **If `quality_status == 'UNKNOWN'`**: "The Living Room AC status is currently unknown."

---

## 4. Server-Side Tool Execution Handler

```typescript
// Server-Side Cypher Tool Execution Handler (Revision 4.2)
export async function executeSetApplianceCapability(
  authenticatedUserId: string,
  params: SetCapabilityParams
): Promise<ToolExecutionResult> {
  // 1. Mandatory Server-Side Authorization Verification
  const isMember = await Database.verifyHomeMember(params.homeId, authenticatedUserId);
  if (!isMember) {
    // Log Security Audit Event
    await Database.logSecurityAuditEvent({
      eventType: "CYPHER_TOOL_REJECTED",
      initiatorId: authenticatedUserId,
      homeId: params.homeId,
      payload: { reason: "UNAUTHORIZED_HOME_ACCESS", params }
    });
    throw new SecurityError("FORBIDDEN: User does not hold active membership in target home_id");
  }

  // 2. Validate Appliance Ownership within Home
  const applianceBinding = await Database.getApplianceBinding(params.applianceId, params.homeId, params.abstractCapability);
  if (!applianceBinding) {
    throw new ValidationError("INVALID_APPLIANCE: Appliance or capability binding not found in home");
  }

  // 3. High-Risk Confirmation Barrier
  if (applianceBinding.isHighRisk && !params.userConfirmationPin) {
    return {
      status: "REQUIRES_CONFIRMATION",
      message: `Toggling ${applianceBinding.displayName} is classified as high-risk. Please confirm with your PIN.`
    };
  }

  // 4. Dispatch via CommandCoordinator
  return await CommandCoordinator.dispatch({
    homeId: params.homeId,
    applianceId: params.applianceId,
    deviceId: applianceBinding.deviceId,
    endpointInstanceId: applianceBinding.endpointInstanceId,
    capability: applianceBinding.capabilityType,
    desiredValue: params.desiredValue
  });
}
```
