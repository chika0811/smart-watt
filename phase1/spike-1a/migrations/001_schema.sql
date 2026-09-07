-- Phase 1A.1 Schema Migration: Roles, Security Privileges, Table Partitioning, and RLS

-- 1. Helper function simulating Supabase auth.uid()
CREATE OR REPLACE FUNCTION requesting_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Enumerated Custom Types
DO $$ BEGIN
    CREATE TYPE public.home_role AS ENUM ('owner', 'admin', 'member', 'guest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.device_inventory_status AS ENUM ('unclaimed', 'claimed', 'assigned', 'decommissioned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.command_lifecycle_status AS ENUM (
        'created', 'dispatched', 'accepted', 'executed', 'confirmed', 'expired', 'rejected', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.data_quality_status AS ENUM ('fresh', 'stale', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Identity & Tenancy Tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.home_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(home_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Hardware Catalog & Devices
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    product_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    model_number TEXT UNIQUE NOT NULL,
    hardware_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT UNIQUE NOT NULL,
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

-- SEC-01 BOUNDARY: device_credentials has NO RLS; client access is REVOKED at table level
CREATE TABLE IF NOT EXISTS public.device_credentials (
    device_id UUID PRIMARY KEY REFERENCES public.devices(id) ON DELETE CASCADE,
    rsa_public_key TEXT NOT NULL,
    preshared_setup_secret_hash TEXT NOT NULL,
    lan_trust_credential_hash TEXT,
    last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    instance_id TEXT NOT NULL,
    capability_type TEXT NOT NULL,
    value_type TEXT NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    possible_values JSONB,
    UNIQUE(device_id, instance_id)
);

-- 5. Composite Appliance Mapping
CREATE TABLE IF NOT EXISTS public.appliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'generic_appliance',
    category TEXT NOT NULL,
    is_high_risk BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appliance_endpoint_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appliance_id UUID NOT NULL REFERENCES public.appliances(id) ON DELETE CASCADE,
    device_endpoint_id UUID NOT NULL REFERENCES public.device_endpoints(id) ON DELETE CASCADE,
    abstract_capability TEXT NOT NULL,
    display_name TEXT,
    UNIQUE(appliance_id, abstract_capability)
);

-- 6. State & Command Tracking
CREATE TABLE IF NOT EXISTS public.device_states (
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

CREATE TABLE IF NOT EXISTS public.device_commands (
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

CREATE TABLE IF NOT EXISTS public.security_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    initiator_id UUID REFERENCES public.users(id),
    home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Range Partitioned Telemetry Logs Table
CREATE TABLE IF NOT EXISTS public.device_telemetry_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL,
    metric_key TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create Monthly Telemetry Partitions for Testing
CREATE TABLE IF NOT EXISTS public.device_telemetry_logs_y2026m08 PARTITION OF public.device_telemetry_logs
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.device_telemetry_logs_y2026m09 PARTITION OF public.device_telemetry_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_endpoint_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. HOMES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view homes they belong to" ON public.homes;
CREATE POLICY "Users can view homes they belong to"
ON public.homes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = homes.id
        AND home_members.user_id = requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Owners can update homes" ON public.homes;
CREATE POLICY "Owners can update homes"
ON public.homes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = homes.id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role = 'owner'
    )
);

DROP POLICY IF EXISTS "Owners can delete homes" ON public.homes;
CREATE POLICY "Owners can delete homes"
ON public.homes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = homes.id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role = 'owner'
    )
);

-- ----------------------------------------------------------------------------
-- 2. HOME MEMBERS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view members of their homes" ON public.home_members;
CREATE POLICY "Users can view members of their homes"
ON public.home_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.home_members self_m
        WHERE self_m.home_id = home_members.home_id
        AND self_m.user_id = requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Owners and Admins can manage home members" ON public.home_members;
CREATE POLICY "Owners and Admins can manage home members"
ON public.home_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.home_members self_m
        WHERE self_m.home_id = home_members.home_id
        AND self_m.user_id = requesting_user_id()
        AND self_m.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.home_members self_m
        WHERE self_m.home_id = home_members.home_id
        AND self_m.user_id = requesting_user_id()
        AND self_m.role IN ('owner', 'admin')
    )
);

-- ----------------------------------------------------------------------------
-- 3. DEVICES & ENDPOINTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view devices in authorized homes" ON public.devices;
CREATE POLICY "Users can view devices in authorized homes"
ON public.devices FOR SELECT
USING (
    home_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = devices.home_id
        AND home_members.user_id = requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Owners and Admins can claim and assign devices" ON public.devices;
CREATE POLICY "Owners and Admins can claim and assign devices"
ON public.devices FOR UPDATE
USING (
    home_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = devices.home_id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "Users can view endpoints in authorized homes" ON public.device_endpoints;
CREATE POLICY "Users can view endpoints in authorized homes"
ON public.device_endpoints FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        JOIN public.home_members ON home_members.home_id = devices.home_id
        WHERE devices.id = device_endpoints.device_id
        AND home_members.user_id = requesting_user_id()
    )
);

-- ----------------------------------------------------------------------------
-- 4. APPLIANCES & BINDINGS POLICIES (CROSS-HOME PROTECTION)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view appliances in authorized homes" ON public.appliances;
CREATE POLICY "Users can view appliances in authorized homes"
ON public.appliances FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = appliances.home_id
        AND home_members.user_id = requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Owners and Admins can insert/update/delete appliances" ON public.appliances;
CREATE POLICY "Owners and Admins can insert/update/delete appliances"
ON public.appliances FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = appliances.home_id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.home_members
        WHERE home_members.home_id = appliances.home_id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "Users can view bindings in authorized homes" ON public.appliance_endpoint_bindings;
CREATE POLICY "Users can view bindings in authorized homes"
ON public.appliance_endpoint_bindings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.appliances
        JOIN public.home_members ON home_members.home_id = appliances.home_id
        WHERE appliances.id = appliance_endpoint_bindings.appliance_id
        AND home_members.user_id = requesting_user_id()
    )
);

-- Strict Cross-Home Binding Policy: Binding MUST connect an Appliance and Device Endpoint in the SAME Home!
DROP POLICY IF EXISTS "Owners/Admins manage bindings within same home" ON public.appliance_endpoint_bindings;
CREATE POLICY "Owners/Admins manage bindings within same home"
ON public.appliance_endpoint_bindings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.appliances a
        JOIN public.home_members hm ON hm.home_id = a.home_id
        JOIN public.device_endpoints ep ON ep.id = appliance_endpoint_bindings.device_endpoint_id
        JOIN public.devices d ON d.id = ep.device_id AND d.home_id = a.home_id
        WHERE a.id = appliance_endpoint_bindings.appliance_id
        AND hm.user_id = requesting_user_id()
        AND hm.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appliances a
        JOIN public.home_members hm ON hm.home_id = a.home_id
        JOIN public.device_endpoints ep ON ep.id = appliance_endpoint_bindings.device_endpoint_id
        JOIN public.devices d ON d.id = ep.device_id AND d.home_id = a.home_id
        WHERE a.id = appliance_endpoint_bindings.appliance_id
        AND hm.user_id = requesting_user_id()
        AND hm.role IN ('owner', 'admin')
    )
);

-- ----------------------------------------------------------------------------
-- 5. DEVICE COMMANDS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view commands in authorized homes" ON public.device_commands;
CREATE POLICY "Users can view commands in authorized homes"
ON public.device_commands FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        JOIN public.home_members ON home_members.home_id = devices.home_id
        WHERE devices.id = device_commands.device_id
        AND home_members.user_id = requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Owners, Admins, and Members can issue commands" ON public.device_commands;
CREATE POLICY "Owners, Admins, and Members can issue commands"
ON public.device_commands FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.devices
        JOIN public.home_members ON home_members.home_id = devices.home_id
        WHERE devices.id = device_commands.device_id
        AND home_members.user_id = requesting_user_id()
        AND home_members.role IN ('owner', 'admin', 'member')
    )
);

-- ----------------------------------------------------------------------------
-- 6. TELEMETRY LOGS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view telemetry in authorized homes" ON public.device_telemetry_logs;
CREATE POLICY "Users can view telemetry in authorized homes"
ON public.device_telemetry_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        JOIN public.home_members ON home_members.home_id = devices.home_id
        WHERE devices.id = device_telemetry_logs.device_id
        AND home_members.user_id = requesting_user_id()
    )
);

-- ============================================================================
-- POSTGRESQL PRIVILEGES & ROLES SETUP (SEC-01 & SERVICE-ROLE BOUNDARY)
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_user') THEN
        CREATE ROLE authenticated_user NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- Schema usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated_user, service_role;

-- Authenticated User table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_user;

-- Service Role table privileges (Full control)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- CRITICAL SECURITY REQUIREMENT: Revoke ALL access to device_credentials from clients (authenticated_user & anon)
REVOKE ALL ON TABLE public.device_credentials FROM authenticated_user, anon;

-- Ensure service_role alone has access to device_credentials
GRANT ALL ON TABLE public.device_credentials TO service_role;
