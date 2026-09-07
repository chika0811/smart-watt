#ifndef AUTOMATION_ENGINE_H
#define AUTOMATION_ENGINE_H

#include "logical_version.h"
#include "rule_store.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    PRESENCE_ABSENT = 0,
    PRESENCE_PRESENT,
    PRESENCE_UNKNOWN
} presence_state_t;

class LocalAutomationEngine {
public:
    LocalAutomationEngine(LogicalVersionEngine* version_engine, LocalRuleStore* rule_store);
    ~LocalAutomationEngine();

    bool initialize();

    // Set RTC clock state & validity
    void set_rtc_time(uint64_t current_time_sec, bool rtc_valid);
    bool is_rtc_valid() const { return rtc_valid_; }

    // Update Presence / Sensor observation (Observation only -> NO version increment)
    void update_presence_sensor(presence_state_t state, uint8_t confidence, uint64_t timestamp_sec);

    // Get relay physical state
    bool get_relay_state(uint8_t relay_index) const;
    void force_relay_state_raw(uint8_t relay_index, bool state);

    // Evaluate RTC schedules & sensor rules
    size_t evaluate_rules(uint64_t current_time_sec, bool is_reboot_eval = false);

    // Direct Manual / Command Actuation (Triggers version mutation if state changes)
    bool actuate_relay(uint8_t relay_index, bool desired_state, version_tuple_t* out_version);

    presence_state_t get_presence_state() const { return presence_state_; }
    uint8_t get_presence_confidence() const { return presence_confidence_; }

private:
    LogicalVersionEngine* version_engine_;
    LocalRuleStore* rule_store_;
    uint64_t rtc_current_time_sec_;
    bool rtc_valid_;
    presence_state_t presence_state_;
    uint8_t presence_confidence_;
    uint64_t presence_last_detected_at_;
    bool relay_states_[8];

    bool evaluate_condition(const automation_rule_t* rule) const;
    bool parse_cron_time(const char* cron_str, uint8_t* out_hour, uint8_t* out_min) const;
};

#ifdef __cplusplus
}
#endif

#endif // AUTOMATION_ENGINE_H
