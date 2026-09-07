#include "rule_store.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

LocalRuleStore::LocalRuleStore() : rule_count_(0) {
    memset(rules_, 0, sizeof(rules_));
}

LocalRuleStore::~LocalRuleStore() {}

bool LocalRuleStore::initialize() {
    rule_count_ = 0;
    memset(rules_, 0, sizeof(rules_));
    return true;
}

void LocalRuleStore::compute_fingerprint(
    trigger_type_t trigger_type,
    const char* cron_str,
    const char* endpoint_id,
    bool desired_value,
    char out_fingerprint[FINGERPRINT_LEN]
) {
    if (!out_fingerprint) return;

    char buf[128] = {0};
    snprintf(buf, sizeof(buf), "TRIG:%d:CRON:%s:EP:%s:VAL:%d", 
             (int)trigger_type, 
             cron_str ? cron_str : "", 
             endpoint_id ? endpoint_id : "", 
             desired_value ? 1 : 0);

    // Simple deterministic 64-char hex hash string for simulation
    uint32_t hash1 = 5381;
    uint32_t hash2 = 0x811C9DC5;
    for (size_t i = 0; buf[i] != '\0'; i++) {
        hash1 = ((hash1 << 5) + hash1) + buf[i];
        hash2 = (hash2 ^ buf[i]) * 16777619;
    }

    snprintf(out_fingerprint, FINGERPRINT_LEN, "%08x%08x%08x%08x%08x%08x%08x%08x",
             hash1, hash2, hash1 ^ hash2, hash2 ^ 0x3C,
             hash1 + 1, hash2 + 2, hash1 ^ 0xAA, hash2 ^ 0xBB);
}

const automation_rule_t* LocalRuleStore::find_by_fingerprint(const char* fingerprint) const {
    if (!fingerprint) return NULL;
    for (size_t i = 0; i < rule_count_; i++) {
        if (strcmp(rules_[i].fingerprint, fingerprint) == 0) {
            return &rules_[i];
        }
    }
    return NULL;
}

const automation_rule_t* LocalRuleStore::get_rule(const char* rule_id) const {
    if (!rule_id) return NULL;
    for (size_t i = 0; i < rule_count_; i++) {
        if (strcmp(rules_[i].rule_id, rule_id) == 0) {
            return &rules_[i];
        }
    }
    return NULL;
}

const automation_rule_t* LocalRuleStore::get_rule_at(size_t index) const {
    if (index >= rule_count_) return NULL;
    return &rules_[index];
}

bool LocalRuleStore::add_rule(const automation_rule_t* rule, bool* is_duplicate_out) {
    if (!rule || rule_count_ >= MAX_RULES) return false;

    // Check for duplicate via fingerprint
    if (find_by_fingerprint(rule->fingerprint) != NULL) {
        if (is_duplicate_out) *is_duplicate_out = true;
        return false; // Duplicate rule rejected!
    }

    if (is_duplicate_out) *is_duplicate_out = false;
    rules_[rule_count_] = *rule;
    rule_count_++;
    return true;
}

bool LocalRuleStore::update_rule(const automation_rule_t* rule) {
    if (!rule) return false;
    for (size_t i = 0; i < rule_count_; i++) {
        if (strcmp(rules_[i].rule_id, rule->rule_id) == 0) {
            rules_[i] = *rule;
            return true;
        }
    }
    return false;
}

bool LocalRuleStore::delete_rule(const char* rule_id) {
    if (!rule_id) return false;
    for (size_t i = 0; i < rule_count_; i++) {
        if (strcmp(rules_[i].rule_id, rule_id) == 0) {
            // Shift array elements left
            for (size_t j = i; j < rule_count_ - 1; j++) {
                rules_[j] = rules_[j + 1];
            }
            memset(&rules_[rule_count_ - 1], 0, sizeof(automation_rule_t));
            rule_count_--;
            return true;
        }
    }
    return false;
}

bool LocalRuleStore::set_rule_enabled(const char* rule_id, bool enabled) {
    if (!rule_id) return false;
    for (size_t i = 0; i < rule_count_; i++) {
        if (strcmp(rules_[i].rule_id, rule_id) == 0) {
            rules_[i].enabled = enabled;
            return true;
        }
    }
    return false;
}

size_t LocalRuleStore::get_rules_sorted_by_priority(automation_rule_t out_rules[MAX_RULES]) const {
    if (!out_rules) return 0;
    for (size_t i = 0; i < rule_count_; i++) {
        out_rules[i] = rules_[i];
    }

    // Stable sort: higher priority first; if equal priority, last-committed (higher original index) wins
    for (size_t i = 0; i < rule_count_; i++) {
        for (size_t j = i + 1; j < rule_count_; j++) {
            if (out_rules[j].priority > out_rules[i].priority) {
                automation_rule_t tmp = out_rules[i];
                out_rules[i] = out_rules[j];
                out_rules[j] = tmp;
            } else if (out_rules[j].priority == out_rules[i].priority && out_rules[j].created_at > out_rules[i].created_at) {
                automation_rule_t tmp = out_rules[i];
                out_rules[i] = out_rules[j];
                out_rules[j] = tmp;
            }
        }
    }

    return rule_count_;
}

void LocalRuleStore::clear_all() {
    rule_count_ = 0;
    memset(rules_, 0, sizeof(rules_));
}
