#include "logical_version.h"
#include "rule_store.h"
#include "automation_engine.h"
#include <stdio.h>
#include <string.h>
#include <assert.h>

extern "C" void app_main(void) {
    printf("===================================================================\n");
    printf(" NOSKYTECH PHASE 1F — LOGICAL VERSION & RULE ENGINE SELF-TEST     \n");
    printf("===================================================================\n");

    // 1. Test Logical Version Engine Initialization
    LogicalVersionEngine version_engine;
    version_engine.initialize(1, 0);
    version_tuple_t ver = version_engine.get_active_version();
    assert(ver.epoch == 1 && ver.sequence == 0);
    printf("[PASS] VER-01 Initial version (epoch=1, sequence=0) verified.\n");

    // 2. Test State Mutation Version Increment
    version_tuple_t ver_mutated;
    bool mutated = version_engine.process_operation("RELAY_TOGGLE", 1, 1, true, &ver_mutated);
    assert(mutated && ver_mutated.sequence == 1);
    printf("[PASS] VER-02 State mutation increments sequence (sequence=1).\n");

    // 3. Test Telemetry Observation Version Non-Increment
    version_tuple_t ver_obs;
    version_engine.process_operation("TELEMETRY_VOLTAGE", 1, 2, false, &ver_obs);
    assert(ver_obs.sequence == 1);
    printf("[PASS] VER-03 Telemetry observation reuses sequence without increment (sequence=1).\n");

    // 4. Test Duplicate Command Idempotency
    version_tuple_t ver_dup;
    version_engine.process_operation("RELAY_TOGGLE", 1, 1, false, &ver_dup);
    assert(ver_dup.sequence == 1);
    printf("[PASS] VER-04 Duplicate command produces no state change or sequence increment.\n");

    // 5. Test Stale Command Rejection
    bool stale_res = version_engine.process_operation("RELAY_TOGGLE", 1, 1, true, NULL);
    assert(stale_res == false);
    printf("[PASS] VER-05 Stale command version (seq 1 <= active seq 1) rejected.\n");

    // 6. Test Rule Store & Automation Engine Integration
    LocalRuleStore rule_store;
    rule_store.initialize();
    LocalAutomationEngine auto_engine(&version_engine, &rule_store);
    auto_engine.initialize();

    // Create Rule: Turn bulb ON at 07:00 AM if presence is ABSENT
    automation_rule_t rule1;
    memset(&rule1, 0, sizeof(rule1));
    strncpy(rule1.rule_id, "rule-7777-8888", 36);
    rule1.enabled = true;
    rule1.priority = 10;
    rule1.trigger_type = TRIGGER_TYPE_TIME;
    strncpy(rule1.cron_str, "0 7 * * *", 31);
    strncpy(rule1.condition_field, "presence_state", 31);
    strncpy(rule1.condition_operator, "EQUALS", 15);
    strncpy(rule1.condition_val, "ABSENT", 31);
    rule1.action_type = ACTION_TYPE_SET_OUTPUT;
    strncpy(rule1.endpoint_id, "relay_1", 31);
    rule1.desired_value = true;
    rule1.missed_policy = MISSED_POLICY_IGNORE;
    LocalRuleStore::compute_fingerprint(rule1.trigger_type, rule1.cron_str, rule1.endpoint_id, rule1.desired_value, rule1.fingerprint);

    bool rule_added = rule_store.add_rule(&rule1);
    assert(rule_added);
    printf("[PASS] RULE-01 Rule creation and storage succeeded.\n");

    // Set Sensor to ABSENT & RTC to 07:00 AM (timestamp 25200s into day)
    auto_engine.update_presence_sensor(PRESENCE_ABSENT, 100, 1772193600);
    auto_engine.set_rtc_time(1772175600, true); // 07:00:00 UTC

    size_t executed = auto_engine.evaluate_rules(1772175600);
    assert(executed == 1);
    assert(auto_engine.get_relay_state(0) == true);
    ver = version_engine.get_active_version();
    assert(ver.sequence == 2);
    printf("[PASS] RULE-03 Rule executed locally offline; relay toggled ON; sequence incremented to 2.\n");

    // 7. Double-Buffered NVS Crash Recovery Test
    nvs_version_slot_t slot_a, slot_b;
    version_engine.commit_to_nvs_slot(&slot_a, &slot_b, true); // Corrupt Slot A
    LogicalVersionEngine version_engine_recovered;
    bool rec_res = version_engine_recovered.recover_from_nvs_slots(&slot_a, &slot_b);
    assert(rec_res);
    version_tuple_t ver_rec = version_engine_recovered.get_active_version();
    assert(ver_rec.sequence == 2);
    printf("[PASS] CRASH-01 Interrupted version commit recovered safely from Slot B (sequence=2).\n");

    printf("===================================================================\n");
    printf(" [SUCCESS] PHASE 1F FIRMWARE SELF-TEST COMPLETED PASSED!           \n");
    printf("===================================================================\n");
}
