-- Phase 1A Automated SQL Test Suite: RLS Multi-Tenant Isolation & Role Hierarchy Verification

BEGIN;

-- Helper macro function to verify statement execution results
CREATE OR REPLACE FUNCTION assert_row_count(expected INT, query_name TEXT, actual INT) RETURNS VOID AS $$
BEGIN
    IF expected IS DISTINCT FROM actual THEN
        RAISE EXCEPTION 'TEST FAILURE [%]: Expected % rows, got %', query_name, expected, actual;
    ELSE
        RAISE NOTICE 'TEST SUCCESS [%]: % rows verified', query_name, actual;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TEST SUITE A: IDENTITY ISOLATION (USER A vs HOME B)
-- ============================================================================

-- Set active JWT session identity to User A (Owner of Home A)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- ISO-01: User A queries homes (Must ONLY see Home A)
    SELECT COUNT(*) INTO row_cnt FROM public.homes;
    PERFORM assert_row_count(1, 'ISO-01: User A Homes Count', row_cnt);

    -- Verify that Home B is NOT visible
    SELECT COUNT(*) INTO row_cnt FROM public.homes WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    PERFORM assert_row_count(0, 'ISO-01B: User A Access Home B', row_cnt);

    -- ISO-02: User A queries devices (Must ONLY see Devices A1 and A2)
    SELECT COUNT(*) INTO row_cnt FROM public.devices;
    PERFORM assert_row_count(2, 'ISO-02: User A Devices Count', row_cnt);

    -- ISO-03: User A attempts UPDATE on Home B
    UPDATE public.homes SET name = 'ATTACKED_BY_USER_A' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'ISO-03: Cross-Tenant UPDATE Home B', row_cnt);

    -- ISO-04: User A attempts DELETE on Home B Appliance
    DELETE FROM public.appliances WHERE id = '77777777-7777-7777-7777-222222222222';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'ISO-04: Cross-Tenant DELETE Appliance B', row_cnt);
END $$;


-- ============================================================================
-- TEST SUITE B: ROLE-BASED ACCESS CONTROL (RBAC) HIERARCHY IN HOME A
-- ============================================================================

-- 1. Test GUEST Role (Arthur)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-444444444444';

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- Guest can view appliances in Home A
    SELECT COUNT(*) INTO row_cnt FROM public.appliances WHERE home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    PERFORM assert_row_count(1, 'RBAC-GUEST-01: View Appliances', row_cnt);

    -- Guest CANNOT modify appliances
    UPDATE public.appliances SET name = 'Guest Hacked' WHERE id = '77777777-7777-7777-7777-111111111111';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'RBAC-GUEST-02: Block Guest UPDATE Appliance', row_cnt);

    -- Guest CANNOT issue device commands
    INSERT INTO public.device_commands (
        command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
    ) VALUES (
        gen_random_uuid(), gen_random_uuid(), 1,
        '55555555-5555-5555-5555-111111111111', '66666666-6666-6666-6666-111111111111', '{"power": false}'
    );
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'RBAC-GUEST-03: Block Guest INSERT Command', row_cnt);
END $$;


-- 2. Test MEMBER Role (Amelia)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-333333333333';

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- Member CAN issue device commands
    INSERT INTO public.device_commands (
        command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
    ) VALUES (
        gen_random_uuid(), gen_random_uuid(), 2,
        '55555555-5555-5555-5555-111111111111', '66666666-6666-6666-6666-111111111111', '{"power": false}'
    );
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(1, 'RBAC-MEMBER-01: Allow Member INSERT Command', row_cnt);

    -- Member CANNOT manage appliances
    UPDATE public.appliances SET name = 'Member Modified' WHERE id = '77777777-7777-7777-7777-111111111111';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'RBAC-MEMBER-02: Block Member UPDATE Appliance', row_cnt);

    -- Member CANNOT delete Home A
    DELETE FROM public.homes WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'RBAC-MEMBER-03: Block Member DELETE Home', row_cnt);
END $$;


-- 3. Test ADMIN Role (Aaron)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-222222222222';

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- Admin CAN manage appliances
    UPDATE public.appliances SET name = 'Living Room Comfort System (Admin Renamed)' WHERE id = '77777777-7777-7777-7777-111111111111';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(1, 'RBAC-ADMIN-01: Allow Admin UPDATE Appliance', row_cnt);

    -- Admin CANNOT delete Home A (Owner only)
    DELETE FROM public.homes WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'RBAC-ADMIN-02: Block Admin DELETE Home', row_cnt);
END $$;


-- 4. Test OWNER Role (Alice)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- Owner CAN update Home A
    UPDATE public.homes SET name = 'Alpha Residence (Owner Verified)' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(1, 'RBAC-OWNER-01: Allow Owner UPDATE Home', row_cnt);
END $$;


-- ============================================================================
-- TEST SUITE C: COMPOSITE APPLIANCE RESOLUTION
-- ============================================================================

SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    bound_capabilities_cnt INT;
    distinct_devices_cnt INT;
BEGIN
    -- Query composite appliance "Living Room Comfort System"
    SELECT COUNT(*), COUNT(DISTINCT d.id)
    INTO bound_capabilities_cnt, distinct_devices_cnt
    FROM public.appliances a
    JOIN public.appliance_endpoint_bindings b ON b.appliance_id = a.id
    JOIN public.device_endpoints ep ON ep.id = b.device_endpoint_id
    JOIN public.devices d ON d.id = ep.device_id
    WHERE a.id = '77777777-7777-7777-7777-111111111111';

    PERFORM assert_row_count(3, 'COMP-01: Bound Capabilities Count', bound_capabilities_cnt);
    PERFORM assert_row_count(2, 'COMP-02: Spanning Physical Devices Count', distinct_devices_cnt);
END $$;


-- ============================================================================
-- TEST SUITE D: ADVERSARIAL ATTACK VECTORS
-- ============================================================================

SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- User A

DO $$
DECLARE
    row_cnt INT;
BEGIN
    -- ADV-01: User A attempts forged command injection to Device B1 in Home B
    INSERT INTO public.device_commands (
        command_id, correlation_id, coordinator_revision, device_id, endpoint_id, desired_value
    ) VALUES (
        gen_random_uuid(), gen_random_uuid(), 99,
        '55555555-5555-5555-5555-333333333333', '66666666-6666-6666-6666-444444444444', '{"power": true}'
    );
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'ADV-01: Forged Cross-Home Command Injection', row_cnt);
END $$;

-- ADV-02: Member Privilege Escalation to Owner
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-333333333333'; -- Member (Amelia)

DO $$
DECLARE
    row_cnt INT;
BEGIN
    UPDATE public.home_members
    SET role = 'owner'
    WHERE user_id = '11111111-1111-1111-1111-333333333333';
    GET DIAGNOSTICS row_cnt = ROW_COUNT;
    PERFORM assert_row_count(0, 'ADV-02: Member Privilege Escalation to Owner', row_cnt);
END $$;

ROLLBACK;
