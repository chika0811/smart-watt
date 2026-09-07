#ifndef RULE_STORE_H
#define RULE_STORE_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_RULES 32
#define RULE_ID_LEN 37
#define FINGERPRINT_LEN 65

typedef enum {
    TRIGGER_TYPE_TIME = 0,
    TRIGGER_TYPE_SENSOR,
    TRIGGER_TYPE_STATE
} trigger_type_t;

typedef enum {
    ACTION_TYPE_SET_OUTPUT = 0
} action_type_t;

typedef enum {
    MISSED_POLICY_IGNORE = 0,
    MISSED_POLICY_CATCH_UP
} missed_policy_t;

typedef struct {
    char rule_id[RULE_ID_LEN];
    bool enabled;
    uint8_t priority;
    trigger_type_t trigger_type;
    char cron_str[32];
    char sensor_instance_id[32];
    char condition_field[32];
    char condition_operator[16];
    char condition_val[32];
    action_type_t action_type;
    char endpoint_id[32];
    bool desired_value;
    char timezone[32];
    missed_policy_t missed_policy;
    char fingerprint[FINGERPRINT_LEN];
    uint64_t created_at;
} automation_rule_t;

class LocalRuleStore {
public:
    LocalRuleStore();
    ~LocalRuleStore();

    bool initialize();

    // Compute deterministic fingerprint hash for deduplication
    static void compute_fingerprint(
        trigger_type_t trigger_type,
        const char* cron_str,
        const char* endpoint_id,
        bool desired_value,
        char out_fingerprint[FINGERPRINT_LEN]
    );

    // Rule CRUD operations
    bool add_rule(const automation_rule_t* rule, bool* is_duplicate_out = NULL);
    bool update_rule(const automation_rule_t* rule);
    bool delete_rule(const char* rule_id);
    bool set_rule_enabled(const char* rule_id, bool enabled);
    const automation_rule_t* get_rule(const char* rule_id) const;
    const automation_rule_t* find_by_fingerprint(const char* fingerprint) const;

    size_t get_rule_count() const { return rule_count_; }
    const automation_rule_t* get_rule_at(size_t index) const;

    // Get rules sorted by priority (higher priority number first, equal priority resolves to last committed)
    size_t get_rules_sorted_by_priority(automation_rule_t out_rules[MAX_RULES]) const;

    void clear_all();

private:
    automation_rule_t rules_[MAX_RULES];
    size_t rule_count_;
};

#ifdef __cplusplus
}
#endif

#endif // RULE_STORE_H
