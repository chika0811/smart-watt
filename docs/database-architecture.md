# NoskyTech Ecosystem — Database Architecture & ERD Specification (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Overview & Data Retention Architecture

Revision 4.2 enforces strict data lifecycle policies, partitioning high-volume logs and separating operational event streams from security audit logs.

### Data Retention & Lifecycle Policies

| Table Name | Storage Type | Retention Window | Archival / Cleanup Strategy |
| :--- | :--- | :--- | :--- |
| `device_commands` | Hot PostgreSQL | 30 Days | Automated daily cron moves commands > 30 days to S3/Parquet cold archive. |
| `device_telemetry_logs` | Partitioned Range | 30 Days Raw | Partitioned by month. Raw telemetry aggregated to hourly averages after 30 days. |
| `operational_events` | Append-Only Table | 14 Days | High-frequency events (`device.online`, `temp.reading`) truncated after 14 days. |
| `security_audit_events`| Append-Only Table | 365 Days Minimum | Immutable audit trail (`user.login`, `device.claimed`, `cypher.rejected`). WORM storage. |

---

## 2. Complete Entity-Relationship Diagram (ERD — Revision 4.2)

```mermaid
erDiagram
    users ||--o{ profiles : "has"
    users ||--o{ home_members : "belongs to"
    homes ||--o{ home_members : "contains"
    homes ||--o{ rooms : "contains"
    homes ||--o{ appliances : "contains"
    rooms ||--o{ appliances : "placed in"

    products ||--o{ product_models : "has"
    product_models ||--o{ devices : "instantiates"
    
    homes ||--o{ devices : "owns"
    devices ||--o1 device_credentials : "authenticates via"
    devices ||--o{ device_endpoints : "exposes"
    devices ||--o{ device_states : "maintains"
    devices ||--o{ device_telemetry_logs : "emits"
    devices ||--o{ device_commands : "receives"
    devices ||--o{ security_audit_events : "logs security"

    appliances ||--o{ appliance_endpoint_bindings : "maps to"
    device_endpoints ||--o{ appliance_endpoint_bindings : "binds"

    homes ||--o{ scenes : "defines"
    scenes ||--o{ scene_actions : "executes"
    
    homes ||--o{ automations : "configures"
    automations ||--o{ automation_triggers : "triggered by"
    automations ||--o{ automation_conditions : "evaluated by"
    automations ||--o{ automation_actions : "performs"

    users ||--o{ notifications : "receives"
    products ||--o{ firmware_releases : "has updates"
    devices ||--o1 device_firmware : "runs"

    users ||--o{ cypher_conversations : "holds"
    cypher_conversations ||--o{ cypher_messages : "contains"
```

---

## 3. Data Dictionary (Revision 4.2 Schema)

```sql
CREATE TYPE public.home_role AS ENUM ('owner', 'admin', 'member', 'guest');
CREATE TYPE public.device_inventory_status AS ENUM ('unclaimed', 'claimed', 'assigned', 'decommissioned');
CREATE TYPE public.command_lifecycle_status AS ENUM (
    'created', 'dispatched', 'accepted', 'executed', 'confirmed', 'expired', 'rejected', 'failed'
);
CREATE TYPE public.data_quality_status AS ENUM ('fresh', 'stale', 'unknown');

-- 3.1 Devices & Credentials
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL UNIQUE,
    product_model_id UUID NOT NULL REFERENCES public.product_models(id),
    home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    mac_address_wifi TEXT UNIQUE,
    mac_address_ble TEXT UNIQUE,
    status public.device_inventory_status NOT NULL DEFAULT 'unclaimed',
    active_epoch INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.device_credentials (
    device_id UUID PRIMARY KEY REFERENCES public.devices(id) ON DELETE CASCADE,
    rsa_public_key TEXT NOT NULL,        -- Hardware RSA-3072 DS public key for cloud SASL authentication
    preshared_setup_secret_hash TEXT NOT NULL, -- Salted hash of QR code bootstrap setup secret
    lan_trust_credential_hash TEXT,      -- Replacement post-claim long-term LAN credential hash
    last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.device_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    instance_id TEXT NOT NULL,          -- e.g., 'relay_1', 'thermostat_fan', 'sensor_temp'
    capability_type TEXT NOT NULL,      -- 'power', 'temperature', 'fan_speed', 'brightness'
    value_type TEXT NOT NULL,           -- 'boolean', 'integer', 'numeric', 'enum'
    min_value NUMERIC,
    max_value NUMERIC,
    possible_values JSONB,
    UNIQUE(device_id, instance_id)
);

-- 3.2 N-to-N Composite Appliance Bindings
CREATE TABLE public.appliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'generic_appliance',
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.appliance_endpoint_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appliance_id UUID NOT NULL REFERENCES public.appliances(id) ON DELETE CASCADE,
    device_endpoint_id UUID NOT NULL REFERENCES public.device_endpoints(id) ON DELETE CASCADE,
    abstract_capability TEXT NOT NULL,  -- e.g., 'light_power', 'fan_speed'
    display_name TEXT,
    UNIQUE(appliance_id, abstract_capability)
);

-- 3.3 Authoritative State Table
CREATE TABLE public.device_states (
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES public.device_endpoints(id) ON DELETE CASCADE,
    epoch INT NOT NULL DEFAULT 1,
    seq_num BIGINT NOT NULL DEFAULT 0,
    desired_value JSONB,
    reported_value JSONB,
    authoritative_value JSONB,
    quality_status public.data_quality_status NOT NULL DEFAULT 'fresh',
    last_reported_at TIMESTAMPTZ,
    PRIMARY KEY (device_id, endpoint_id)
);

-- 3.4 Command Queue Table (Hot Storage - 30 Day Retention)
CREATE TABLE public.device_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID NOT NULL UNIQUE,
    correlation_id UUID NOT NULL,
    coordinator_revision BIGINT NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES public.device_endpoints(id) ON DELETE CASCADE,
    desired_value JSONB NOT NULL,
    transport_used TEXT,
    status public.command_lifecycle_status NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- 3.5 Immutable Security Audit Log (1 Year Retention)
CREATE TABLE public.security_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,           -- 'USER_LOGIN', 'DEVICE_CLAIMED', 'CYPHER_TOOL_REJECTED'
    initiator_id UUID,
    home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Partitioned Time-Series Telemetry Logs
CREATE TABLE public.device_telemetry_logs (
    id BIGTIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID NOT NULL,
    metric_key TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);
```

---

## 4. Multi-Tenant Authorization via PostgreSQL RLS

Database authorization ("What are you allowed to do?") is strictly enforced by PostgreSQL RLS:

```sql
ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_endpoint_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appliances in authorized homes"
ON public.appliances FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = appliances.home_id
        AND home_members.user_id = auth.uid()
    )
);

CREATE POLICY "Admins and Owners can modify appliances"
ON public.appliances FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = appliances.home_id
        AND home_members.user_id = auth.uid()
        AND home_members.role IN ('owner', 'admin')
    )
);
```
