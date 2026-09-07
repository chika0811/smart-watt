#include "logical_version.h"
#include <string.h>

#define NVS_SLOT_MAGIC 0x56455253

LogicalVersionEngine::LogicalVersionEngine() : is_initialized_(false) {
    active_version_.epoch = 1;
    active_version_.sequence = 0;
}

LogicalVersionEngine::~LogicalVersionEngine() {}

bool LogicalVersionEngine::initialize(uint32_t initial_epoch, uint64_t initial_sequence) {
    active_version_.epoch = initial_epoch;
    active_version_.sequence = initial_sequence;
    is_initialized_ = true;
    return true;
}

operation_classification_t LogicalVersionEngine::classify_operation(const char* operation_name) {
    if (!operation_name) return OPERATION_TYPE_STATE_NON_MUTATING;

    if (strcmp(operation_name, "RELAY_TOGGLE") == 0 ||
        strcmp(operation_name, "RULE_CREATE") == 0 ||
        strcmp(operation_name, "RULE_DELETE") == 0 ||
        strcmp(operation_name, "RULE_UPDATE") == 0 ||
        strcmp(operation_name, "RULE_ENABLE_DISABLE") == 0 ||
        strcmp(operation_name, "CONFIG_CHANGE") == 0 ||
        strcmp(operation_name, "FACTORY_RESET") == 0) {
        return OPERATION_TYPE_STATE_MUTATING;
    }

    if (strcmp(operation_name, "TELEMETRY_VOLTAGE") == 0 ||
        strcmp(operation_name, "TELEMETRY_CURRENT") == 0 ||
        strcmp(operation_name, "TELEMETRY_POWER") == 0 ||
        strcmp(operation_name, "TELEMETRY_ENERGY") == 0 ||
        strcmp(operation_name, "PRESENCE_OBSERVATION") == 0 ||
        strcmp(operation_name, "HEARTBEAT") == 0) {
        return OPERATION_TYPE_OBSERVATION_ONLY;
    }

    return OPERATION_TYPE_STATE_NON_MUTATING;
}

bool LogicalVersionEngine::validate_incoming_version(uint32_t incoming_epoch, uint64_t incoming_seq) const {
    if (incoming_epoch > active_version_.epoch) return true;
    if (incoming_epoch == active_version_.epoch && incoming_seq > active_version_.sequence) return true;
    return false;
}

bool LogicalVersionEngine::process_operation(
    const char* operation_name,
    uint32_t incoming_epoch,
    uint64_t incoming_seq,
    bool is_state_changed,
    version_tuple_t* out_version
) {
    operation_classification_t op_type = classify_operation(operation_name);

    if (op_type == OPERATION_TYPE_OBSERVATION_ONLY) {
        // Observations DO NOT increment sequence; reuse active version
        if (out_version) *out_version = active_version_;
        return true;
    }

    if (op_type == OPERATION_TYPE_STATE_NON_MUTATING || !is_state_changed) {
        // Duplicate command or no physical change -> return active version without increment
        if (out_version) *out_version = active_version_;
        return true;
    }

    // STATE_MUTATING operation with actual state change
    if (!validate_incoming_version(incoming_epoch, incoming_seq)) {
        // Stale command version rejected
        if (out_version) *out_version = active_version_;
        return false;
    }

    // Increment Sequence (handling overflow safely)
    if (active_version_.sequence == UINT64_MAX) {
        active_version_.epoch += 1;
        active_version_.sequence = 0;
    } else {
        active_version_.sequence += 1;
    }

    if (out_version) *out_version = active_version_;
    return true;
}

void LogicalVersionEngine::perform_factory_reset(version_tuple_t* out_version) {
    active_version_.epoch += 1;
    active_version_.sequence = 0;
    if (out_version) *out_version = active_version_;
}

uint32_t LogicalVersionEngine::calculate_crc32(const uint8_t* data, size_t len) {
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & (-(crc & 1)));
        }
    }
    return ~crc;
}

bool LogicalVersionEngine::commit_to_nvs_slot(nvs_version_slot_t* slot_a, nvs_version_slot_t* slot_b, bool simulate_corrupt_slot_a) {
    if (!slot_a || !slot_b) return false;

    // Slot A update
    slot_a->slot_magic = NVS_SLOT_MAGIC;
    slot_a->epoch = active_version_.epoch;
    slot_a->sequence = active_version_.sequence;
    slot_a->crc32 = calculate_crc32((const uint8_t*)slot_a, offsetof(nvs_version_slot_t, crc32));

    if (simulate_corrupt_slot_a) {
        slot_a->crc32 ^= 0xDEADBEEF; // Corrupt Slot A CRC
    }

    // Mirror to Slot B
    *slot_b = *slot_a;
    if (simulate_corrupt_slot_a) {
        // Fix Slot B so it represents the last valid write
        slot_b->crc32 = calculate_crc32((const uint8_t*)slot_b, offsetof(nvs_version_slot_t, crc32));
    }

    return true;
}

bool LogicalVersionEngine::recover_from_nvs_slots(const nvs_version_slot_t* slot_a, const nvs_version_slot_t* slot_b) {
    bool slot_a_valid = false;
    bool slot_b_valid = false;

    if (slot_a && slot_a->slot_magic == NVS_SLOT_MAGIC) {
        uint32_t crc_a = calculate_crc32((const uint8_t*)slot_a, offsetof(nvs_version_slot_t, crc32));
        if (crc_a == slot_a->crc32) slot_a_valid = true;
    }

    if (slot_b && slot_b->slot_magic == NVS_SLOT_MAGIC) {
        uint32_t crc_b = calculate_crc32((const uint8_t*)slot_b, offsetof(nvs_version_slot_t, crc32));
        if (crc_b == slot_b->crc32) slot_b_valid = true;
    }

    if (slot_a_valid && slot_b_valid) {
        // Use higher sequence
        if (slot_a->epoch > slot_b->epoch || (slot_a->epoch == slot_b->epoch && slot_a->sequence >= slot_b->sequence)) {
            active_version_.epoch = slot_a->epoch;
            active_version_.sequence = slot_a->sequence;
        } else {
            active_version_.epoch = slot_b->epoch;
            active_version_.sequence = slot_b->sequence;
        }
        return true;
    }

    if (slot_a_valid) {
        active_version_.epoch = slot_a->epoch;
        active_version_.sequence = slot_a->sequence;
        return true;
    }

    if (slot_b_valid) {
        active_version_.epoch = slot_b->epoch;
        active_version_.sequence = slot_b->sequence;
        return true;
    }

    return false; // Both slots corrupted!
}
