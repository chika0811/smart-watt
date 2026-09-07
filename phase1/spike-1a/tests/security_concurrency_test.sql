-- Phase 1A.1 Security, Privilege Boundary, Concurrency & Partitioning Test Suite

BEGIN;

CREATE OR REPLACE FUNCTION assert_test(expected INT, actual INT, test_name TEXT) RETURNS VOID AS $$
BEGIN
    IF expected IS DISTINCT FROM actual THEN
        RAISE EXCEPTION 'TEST FAILURE [%]: Expected %, got %', test_name, expected, actual;
    ELSE
        RAISE NOTICE 'TEST SUCCESS [%]: % verified', test_name, actual;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. A1 & A3: PRIVILEGE BOUNDARY & DEVICE CREDENTIALS ISOLATION (SEC-01 TO SEC-06)
-- ============================================================================

-- Switch execution context to ordinary 'authenticated_user'
SET LOCAL ROLE authenticated_user;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- User A

-- SEC-01 to SEC-04: Authenticated user direct table operations on device_credentials MUST fail with permission denied
DO $$
DECLARE
    caught_permission_denied BOOLEAN := FALSE;
BEGIN
    BEGIN
        PERFORM * FROM public.device_credentials;
    EXCEPTION WHEN insufficient_privilege THEN
        caught_permission_denied := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN caught_permission_denied THEN 1 ELSE 0 END, 'SEC-01: Client SELECT device_credentials DENIED');

    caught_permission_denied := FALSE;
    BEGIN
        INSERT INTO public.device_credentials (device_id, rsa_public_key, preshared_setup_secret_hash)
        VALUES ('55555555-5555-5555-5555-111111111111', 'pubkey', 'secrethash');
    EXCEPTION WHEN insufficient_privilege THEN
        caught_permission_denied := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN caught_permission_denied THEN 1 ELSE 0 END, 'SEC-02: Client INSERT device_credentials DENIED');

    caught_permission_denied := FALSE;
    BEGIN
        UPDATE public.device_credentials SET rsa_public_key = 'hacked' WHERE device_id = '55555555-5555-5555-5555-111111111111';
    EXCEPTION WHEN insufficient_privilege THEN
        caught_permission_denied := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN caught_permission_denied THEN 1 ELSE 0 END, 'SEC-03: Client UPDATE device_credentials DENIED');

    caught_permission_denied := FALSE;
    BEGIN
        DELETE FROM public.device_credentials WHERE device_id = '55555555-5555-5555-5555-111111111111';
    EXCEPTION WHEN insufficient_privilege THEN
        caught_permission_denied := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN caught_permission_denied THEN 1 ELSE 0 END, 'SEC-04: Client DELETE device_credentials DENIED');
END $$;

-- SEC-05: Authenticated User attempts role escalation to postgres
DO $$
DECLARE
    caught_permission_denied BOOLEAN := FALSE;
BEGIN
    BEGIN
        SET LOCAL ROLE postgres;
    EXCEPTION WHEN insufficient_privilege THEN
        caught_permission_denied := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN caught_permission_denied THEN 1 ELSE 0 END, 'SEC-05: Client SET ROLE postgres DENIED');
END $$;

-- SEC-06: Service Role access to device_credentials MUST succeed
RESET ROLE;
SET LOCAL ROLE service_role;

DO $$
DECLARE
    cred_cnt INT;
BEGIN
    -- Populate seed credentials under service_role
    INSERT INTO public.device_credentials (device_id, rsa_public_key, preshared_setup_secret_hash)
    VALUES ('55555555-5555-5555-5555-111111111111', 'RSA3072_PUB_KEY_HEX_1', 'SETUP_SECRET_HASH_1')
    ON CONFLICT (device_id) DO NOTHING;

    SELECT COUNT(*) INTO cred_cnt FROM public.device_credentials;
    PERFORM assert_test(1, cred_cnt, 'SEC-06: Service Role SELECT device_credentials ALLOWED');
END $$;


-- ============================================================================
-- 2. A5: CROSS-HOME COMPOSITE BINDING ATTACK VERIFICATION
-- ============================================================================

SET LOCAL ROLE authenticated_user;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- User A (Owner of Home A)

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- Attack 1: User A creates binding from Home A appliance -> Home B endpoint
    INSERT INTO public.appliance_endpoint_bindings (appliance_id, device_endpoint_id, abstract_capability)
    VALUES (
        '77777777-7777-7777-7777-111111111111', -- Home A Appliance
        '66666666-6666-6666-6666-444444444444', -- Home B Endpoint (Device B1)
        'hacked_cross_home_capability'
    );
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_test(0, row_cnt, 'A5-ATTACK-01: Cross-Home Binding Appliance A -> Endpoint B');

    -- Attack 2: User A attempts to delete Home B appliance binding
    DELETE FROM public.appliance_endpoint_bindings
    WHERE appliance_id = '77777777-7777-7777-7777-222222222222';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_test(0, row_cnt, 'A5-ATTACK-02: Cross-Home DELETE Binding B');
END $$;


-- ============================================================================
-- 3. A6 & A7 & A8: COMMAND IDEMPOTENCY & CONSTRAINTS VERIFICATION
-- ============================================================================

SET LOCAL ROLE authenticated_user;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- User A

DO $$
DECLARE
    test_cmd_id UUID := '99999999-9999-9999-9999-111111111111';
    cmd_cnt INT;
    fk_error BOOLEAN := FALSE;
BEGIN
    -- Command Idempotency Test: Insert duplicate command_id ON CONFLICT DO NOTHING
    INSERT INTO public.device_commands (
        command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
    ) VALUES (
        test_cmd_id, gen_random_uuid(), 100,
        '55555555-5555-5555-5555-111111111111', '66666666-6666-6666-6666-111111111111', '{"power": true}'
    ) ON CONFLICT (command_id) DO NOTHING;

    -- Second duplicate submission (Same command_id)
    INSERT INTO public.device_commands (
        command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
    ) VALUES (
        test_cmd_id, gen_random_uuid(), 100,
        '55555555-5555-5555-5555-111111111111', '66666666-6666-6666-6666-111111111111', '{"power": true}'
    ) ON CONFLICT (command_id) DO NOTHING;

    -- Assert exactly 1 logical command record was created
    SELECT COUNT(*) INTO cmd_cnt FROM public.device_commands WHERE command_id = test_cmd_id;
    PERFORM assert_test(1, cmd_cnt, 'A6: Idempotent Duplicate Command Insertion');

    -- Foreign Key Constraint Test: Insert command for invalid device_id
    BEGIN
        INSERT INTO public.device_commands (
            command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
        ) VALUES (
            gen_random_uuid(), gen_random_uuid(), 101,
            '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-111111111111', '{"power": true}'
        );
    EXCEPTION WHEN foreign_key_violation THEN
        fk_error := TRUE;
    END;
    PERFORM assert_test(1, CASE WHEN fk_error THEN 1 ELSE 0 END, 'A8: Foreign Key Constraint Enforcement');
END $$;


-- ============================================================================
-- 4. A9: TELEMETRY RANGE PARTITIONING & RETENTION VERIFICATION
-- ============================================================================

RESET ROLE;
SET LOCAL ROLE service_role;

DO $$
DECLARE
    august_cnt INT;
    september_cnt INT;
BEGIN
    -- Insert telemetry records into August 2026 partition
    INSERT INTO public.device_telemetry_logs (device_id, metric_key, metric_value, recorded_at)
    VALUES ('55555555-5555-5555-5555-111111111111', 'temperature', 24.5, '2026-08-15 12:00:00+00');

    -- Insert telemetry records into September 2026 partition
    INSERT INTO public.device_telemetry_logs (device_id, metric_key, metric_value, recorded_at)
    VALUES ('55555555-5555-5555-5555-111111111111', 'temperature', 25.1, '2026-09-05 14:00:00+00');

    -- Verify count in August partition table directly
    SELECT COUNT(*) INTO august_cnt FROM public.device_telemetry_logs_y2026m08;
    PERFORM assert_test(1, august_cnt, 'A9: August 2026 Partition Insertion');

    -- Verify count in September partition table directly
    SELECT COUNT(*) INTO september_cnt FROM public.device_telemetry_logs_y2026m09;
    PERFORM assert_test(1, september_cnt, 'A9: September 2026 Partition Insertion');
END $$;

ROLLBACK;
