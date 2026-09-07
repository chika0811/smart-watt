-- Phase 1A Seed Data: Deterministic Users, Homes, Roles, Devices, and Composite Appliances

-- 1. Insert Seed Users
INSERT INTO public.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'user_a_owner@noskytech.com'),
    ('11111111-1111-1111-1111-222222222222', 'user_a_admin@noskytech.com'),
    ('11111111-1111-1111-1111-333333333333', 'user_a_member@noskytech.com'),
    ('11111111-1111-1111-1111-444444444444', 'user_a_guest@noskytech.com'),
    ('22222222-2222-2222-2222-111111111111', 'user_b_owner@noskytech.com');

INSERT INTO public.profiles (id, full_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice (Home A Owner)'),
    ('11111111-1111-1111-1111-222222222222', 'Aaron (Home A Admin)'),
    ('11111111-1111-1111-1111-333333333333', 'Amelia (Home A Member)'),
    ('11111111-1111-1111-1111-444444444444', 'Arthur (Home A Guest)'),
    ('22222222-2222-2222-2222-111111111111', 'Bob (Home B Owner)');

-- 2. Insert Seed Homes
INSERT INTO public.homes (id, name) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Home A (Alpha Residence)'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Home B (Beta Villa)');

-- 3. Insert Home Memberships with Explicit Roles
INSERT INTO public.home_members (id, home_id, user_id, role) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-222222222222', 'admin'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-333333333333', 'member'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-444444444444', 'guest'),
    (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-111111111111', 'owner');

-- 4. Catalog Metadata
INSERT INTO public.products (id, name, product_code) VALUES
    ('33333333-3333-3333-3333-111111111111', 'SMART WATT Relay Controller', 'NOSKY-SW01');

INSERT INTO public.product_models (id, product_id, model_number, hardware_version) VALUES
    ('44444444-4444-4444-4444-111111111111', '33333333-3333-3333-3333-111111111111', 'SW-8CH-ESP32-V1', 'v1.4');

-- 5. Physical Devices
INSERT INTO public.devices (id, serial_number, product_model_id, home_id, name, status, active_epoch) VALUES
    ('55555555-5555-5555-5555-111111111111', 'NOSKY-SW01-2026-000001', '44444444-4444-4444-4444-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Home A Relay Board 1', 'assigned', 1),
    ('55555555-5555-5555-5555-222222222222', 'NOSKY-SW01-2026-000002', '44444444-4444-4444-4444-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Home A Fan & Temp Controller', 'assigned', 1),
    ('55555555-5555-5555-5555-333333333333', 'NOSKY-SW01-2026-000003', '44444444-4444-4444-4444-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Home B Main Switch Board', 'assigned', 1);

-- 6. Device Endpoints
INSERT INTO public.device_endpoints (id, device_id, instance_id, capability_type, value_type) VALUES
    ('66666666-6666-6666-6666-111111111111', '55555555-5555-5555-5555-111111111111', 'relay_1', 'power', 'boolean'),
    ('66666666-6666-6666-6666-222222222222', '55555555-5555-5555-5555-222222222222', 'relay_1', 'power', 'boolean'),
    ('66666666-6666-6666-6666-333333333333', '55555555-5555-5555-5555-222222222222', 'fan_speed_1', 'fan_speed', 'numeric'),
    ('66666666-6666-6666-6666-444444444444', '55555555-5555-5555-5555-333333333333', 'relay_1', 'power', 'boolean');

-- 7. Composite Appliances & Endpoint Bindings
-- Composite Appliance in Home A: "Living Room Comfort System" spanning Device A1 (light) and Device A2 (fan power + speed)
INSERT INTO public.appliances (id, home_id, name, category, is_high_risk) VALUES
    ('77777777-7777-7777-7777-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Living Room Comfort System', 'climate', false),
    ('77777777-7777-7777-7777-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kitchen Main Light', 'lighting', false);

INSERT INTO public.appliance_endpoint_bindings (id, appliance_id, device_endpoint_id, abstract_capability, display_name) VALUES
    (gen_random_uuid(), '77777777-7777-7777-7777-111111111111', '66666666-6666-6666-6666-111111111111', 'light_power', 'Living Room Light'),
    (gen_random_uuid(), '77777777-7777-7777-7777-111111111111', '66666666-6666-6666-6666-222222222222', 'fan_power', 'Ceiling Fan Power'),
    (gen_random_uuid(), '77777777-7777-7777-7777-111111111111', '66666666-6666-6666-6666-333333333333', 'fan_speed', 'Ceiling Fan Speed'),
    (gen_random_uuid(), '77777777-7777-7777-7777-222222222222', '66666666-6666-6666-6666-444444444444', 'power', 'Kitchen Relay');

-- 8. Authoritative States
INSERT INTO public.device_states (device_id, endpoint_id, epoch, seq_num, desired_value, reported_value, authoritative_value, quality_status) VALUES
    ('55555555-5555-5555-5555-111111111111', '66666666-6666-6666-6666-111111111111', 1, 10, '{"power": true}', '{"power": true}', '{"power": true}', 'fresh'),
    ('55555555-5555-5555-5555-222222222222', '66666666-6666-6666-6666-222222222222', 1, 5, '{"power": false}', '{"power": false}', '{"power": false}', 'fresh'),
    ('55555555-5555-5555-5555-333333333333', '66666666-6666-6666-6666-444444444444', 1, 12, '{"power": true}', '{"power": true}', '{"power": true}', 'fresh');
