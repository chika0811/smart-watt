#ifndef LOGICAL_VERSION_H
#define LOGICAL_VERSION_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    OPERATION_TYPE_STATE_MUTATING = 0,
    OPERATION_TYPE_STATE_NON_MUTATING,
    OPERATION_TYPE_OBSERVATION_ONLY
} operation_classification_t;

typedef struct {
    uint32_t epoch;
    uint64_t sequence;
} version_tuple_t;

typedef struct {
    uint32_t slot_magic;    // 0x56455253 ("VERS")
    uint32_t epoch;
    uint64_t sequence;
    uint32_t crc32;
} nvs_version_slot_t;

class LogicalVersionEngine {
public:
    LogicalVersionEngine();
    ~LogicalVersionEngine();

    bool initialize(uint32_t initial_epoch = 1, uint64_t initial_sequence = 0);
    
    // Classify an incoming action/event
    static operation_classification_t classify_operation(const char* operation_name);

    // Validate incoming version tuple against active version
    bool validate_incoming_version(uint32_t incoming_epoch, uint64_t incoming_seq) const;

    // Execute version mutation if operation is STATE_MUTATING
    bool process_operation(
        const char* operation_name,
        uint32_t incoming_epoch,
        uint64_t incoming_seq,
        bool is_state_changed,
        version_tuple_t* out_version
    );

    // Factory Reset: Increment epoch, reset sequence to 0
    void perform_factory_reset(version_tuple_t* out_version);

    // Double-buffered NVS commit / recovery simulation
    bool commit_to_nvs_slot(nvs_version_slot_t* slot_a, nvs_version_slot_t* slot_b, bool simulate_corrupt_slot_a = false);
    bool recover_from_nvs_slots(const nvs_version_slot_t* slot_a, const nvs_version_slot_t* slot_b);

    version_tuple_t get_active_version() const { return active_version_; }

    static uint32_t calculate_crc32(const uint8_t* data, size_t len);

private:
    version_tuple_t active_version_;
    bool is_initialized_;
};

#ifdef __cplusplus
}
#endif

#endif // LOGICAL_VERSION_H
