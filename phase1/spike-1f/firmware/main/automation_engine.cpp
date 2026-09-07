#include "automation_engine.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

LocalAutomationEngine::LocalAutomationEngine(LogicalVersionEngine* version_engine, LocalRuleStore* rule_store)
    : version_engine_(version_engine),
      rule_store_(rule_store),
      rtc_current_time_sec_(0),
      rtc_valid_(false),
      presence_state_(PRESENCE_UNKNOWN),
      presence_confidence_(0),
      presence_last_detected_at_(0) {
    memset(relay_states_, 0, sizeof(relay_states_));
}

LocalAutomationEngine::~LocalAutomationEngine() {}

bool LocalAutomationEngine::initialize() {
    rtc_current_time_sec_ = 0;
    rtc_valid_ = false;
    presence_state_ = PRESENCE_UNKNOWN;
    presence_confidence_ = 0;
    presence_last_detected_at_ = 0;
    memset(relay_states_, 0, sizeof(relay_states_));
    return true;
}

void LocalAutomationEngine::set_rtc_time(uint64_t current_time_sec, bool rtc_valid) {
    rtc_current_time_sec_ = current_time_sec;
    rtc_valid_ = rtc_valid;
}

void LocalAutomationEngine::update_presence_sensor(presence_state_t state, uint8_t confidence, uint64_t timestamp_sec) {
    // SENSOR OBSERVATION: Does NOT increment sequence counter! Reuses active version.
    presence_state_ = state;
    presence_confidence_ = confidence;
    presence_last_detected_at_ = timestamp_sec;
}

bool LocalAutomationEngine::get_relay_state(uint8_t relay_index) const {
    if (relay_index >= 8) return false;
    return relay_states_[relay_index];
}

void LocalAutomationEngine::force_relay_state_raw(uint8_t relay_index, bool state) {
    if (relay_index < 8) {
        relay_states_[relay_index] = state;
    }
}

bool LocalAutomationEngine::actuate_relay(uint8_t relay_index, bool desired_state, version_tuple_t* out_version) {
    if (relay_index >= 8) return false;

    bool current_state = relay_states_[relay_index];
    bool state_changed = (current_state != desired_state);

    if (state_changed) {
        relay_states_[relay_index] = desired_state;
    }

    // Process version mutation (increments sequence ONLY if state_changed == true)
    version_tuple_t active_ver = version_engine_->get_active_version();
    return version_engine_->process_operation(
        "RELAY_TOGGLE",
        active_ver.epoch,
        active_ver.sequence + 1,
        state_changed,
        out_version
    );
}

bool LocalAutomationEngine::parse_cron_time(const char* cron_str, uint8_t* out_hour, uint8_t* out_min) const {
    if (!cron_str || !out_hour || !out_min) return false;
    // Expected format "min hour * * *" or "0 7 * * *"
    int min_val = 0, hour_val = 0;
    if (sscanf(cron_str, "%d %d", &min_val, &hour_val) == 2) {
        *out_min = (uint8_t)min_val;
        *out_hour = (uint8_t)hour_val;
        return true;
    }
    return false;
}

bool LocalAutomationEngine::evaluate_condition(const automation_rule_t* rule) const {
    if (!rule) return false;
    if (strlen(rule->condition_field) == 0) return true; // No conditions required

    if (strcmp(rule->condition_field, "presence_state") == 0) {
        if (strcmp(rule->condition_operator, "EQUALS") == 0) {
            if (strcmp(rule->condition_val, "ABSENT") == 0) {
                return (presence_state_ == PRESENCE_ABSENT);
            }
            if (strcmp(rule->condition_val, "PRESENT") == 0) {
                return (presence_state_ == PRESENCE_PRESENT);
            }
        }
    }
    return true; // Default pass if condition unhandled
}

size_t LocalAutomationEngine::evaluate_rules(uint64_t current_time_sec, bool is_reboot_eval) {
    if (!rule_store_ || rule_store_->get_rule_count() == 0) return 0;

    rtc_current_time_sec_ = current_time_sec;
    time_t raw_time = (time_t)current_time_sec;
    struct tm* tm_info = gmtime(&raw_time);
    uint8_t current_hour = tm_info ? tm_info->tm_hour : 0;
    uint8_t current_min = tm_info ? tm_info->tm_min : 0;

    automation_rule_t sorted_rules[MAX_RULES];
    size_t count = rule_store_->get_rules_sorted_by_priority(sorted_rules);

    size_t executed_count = 0;

    for (size_t i = 0; i < count; i++) {
        const automation_rule_t* rule = &sorted_rules[i];

        // 1. Skip disabled rules
        if (!rule->enabled) continue;

        bool trigger_fired = false;

        if (rule->trigger_type == TRIGGER_TYPE_TIME) {
            if (!rtc_valid_) continue; // Skip absolute time rules if RTC invalid

            uint8_t rule_hour = 0, rule_min = 0;
            if (parse_cron_time(rule->cron_str, &rule_hour, &rule_min)) {
                if (is_reboot_eval) {
                    if (rule->missed_policy == MISSED_POLICY_CATCH_UP) {
                        // Fire catch up
                        trigger_fired = true;
                    } else {
                        // IGNORE policy
                        trigger_fired = false;
                    }
                } else {
                    if (current_hour == rule_hour && current_min == rule_min) {
                        trigger_fired = true;
                    }
                }
            }
        } else if (rule->trigger_type == TRIGGER_TYPE_SENSOR) {
            if (strcmp(rule->sensor_instance_id, "presence_1") == 0) {
                if (presence_state_ == PRESENCE_PRESENT) {
                    trigger_fired = true;
                }
            }
        }

        if (trigger_fired) {
            // 2. Evaluate conditions
            if (evaluate_condition(rule)) {
                // 3. Execute action
                uint8_t relay_idx = 0;
                if (sscanf(rule->endpoint_id, "relay_%hhu", &relay_idx) == 1 && relay_idx > 0) {
                    relay_idx -= 1; // 0-indexed
                }

                version_tuple_t ver_out;
                bool mutated = actuate_relay(relay_idx, rule->desired_value, &ver_out);
                if (mutated) {
                    executed_count++;
                }
            }
        }
    }

    return executed_count;
}
