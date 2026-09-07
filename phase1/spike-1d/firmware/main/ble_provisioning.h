#ifndef BLE_PROVISIONING_H
#define BLE_PROVISIONING_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define QR_BOOTSTRAP_SECRET_LEN 32     // 256-bit Master Physical QR Setup Secret
#define BLE_OOB_VALUE_LEN 16           // 128-bit Derived BLE LESC OOB Link Pairing Value
#define LAN_TRUST_CREDENTIAL_LEN 32    // 256-bit Derived Long-Term LAN Trust Credential
#define DEVICE_ID_LEN 36
#define HOME_ID_LEN 16
#define TIMEZONE_LEN 32

typedef enum {
    BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP = 0,
    BLE_PROV_STATE_PAIRING_LESC_OOB,
    BLE_PROV_STATE_AUTHENTICATED_SESSION,
    BLE_PROV_STATE_COMMITTING_NVS,
    BLE_PROV_STATE_PROVISIONED_ASSIGNED,
    BLE_PROV_STATE_ERROR
} ble_prov_state_t;

typedef struct {
    char wifi_ssid[32];
    char wifi_password[64];
    uint8_t home_id[HOME_ID_LEN];
    char device_id[DEVICE_ID_LEN + 1];
    char timezone[TIMEZONE_LEN];
    uint64_t rtc_timestamp;
    uint8_t lan_trust_credential[LAN_TRUST_CREDENTIAL_LEN];
    uint64_t msg_sequence;
    bool is_valid;
} provisioning_payload_t;

typedef struct {
    uint8_t primary_slot_valid;
    uint8_t secondary_slot_valid;
    provisioning_payload_t primary_payload;
    provisioning_payload_t secondary_payload;
} nvs_dual_slot_t;

class BleProvisioningServer {
public:
    BleProvisioningServer();
    ~BleProvisioningServer();

    // Initializes server with 256-bit Master Physical QR Secret & derives 128-bit BLE OOB pairing value
    bool initialize(const uint8_t qr_master_secret[QR_BOOTSTRAP_SECRET_LEN]);
    
    // BLE LESC Pairing Handshake
    bool start_lesc_pairing(const uint8_t client_pubkey_p256[64]);
    bool verify_derived_oob_value(const uint8_t client_oob_value[BLE_OOB_VALUE_LEN]);

    // Derived OOB Value Generator (256-bit QR -> 128-bit BLE OOB)
    static void derive_ble_oob_value(const uint8_t qr_master_secret[QR_BOOTSTRAP_SECRET_LEN], uint8_t out_oob_val[BLE_OOB_VALUE_LEN]);

    // GATT Characteristic Access Control (Application Layer AEAD over BLE LESC)
    bool read_characteristic(uint16_t char_uuid, uint8_t* out_buf, size_t* out_len);
    bool write_characteristic(uint16_t char_uuid, const uint8_t* data, size_t len);

    // Encrypted Provisioning Payload Processing (AES-256-GCM Dual-Layer Defense)
    bool process_provisioning_payload(
        const uint8_t* encrypted_payload, 
        size_t len, 
        const uint8_t tag[16], 
        uint64_t sequence,
        const char* wifi_ssid,
        const char* wifi_pass,
        const char* timezone,
        uint64_t rtc_timestamp
    );

    bool derive_lan_trust_credential(uint8_t out_credential[LAN_TRUST_CREDENTIAL_LEN]);

    // Resilience, Atomic Commit & Lifecycle Transitions
    bool atomic_nvs_commit();
    void simulate_power_loss_during_commit();
    void invalidate_bootstrap_credential();
    bool authenticate_lan_with_qr_secret(const uint8_t secret[QR_BOOTSTRAP_SECRET_LEN]);

    void reboot_device();
    void factory_reset();

    // Replay Protection
    bool is_sequence_replayed(uint64_t seq) const;

    // Getters
    ble_prov_state_t get_state() const { return state_; }
    bool is_bootstrap_invalidated() const { return bootstrap_invalidated_; }
    bool is_provisioned() const { return is_provisioned_; }
    const provisioning_payload_t& get_active_payload() const { return nvs_storage_.primary_payload; }
    void get_derived_oob_value(uint8_t out_oob[BLE_OOB_VALUE_LEN]) const { memcpy(out_oob, derived_ble_oob_, BLE_OOB_VALUE_LEN); }

private:
    ble_prov_state_t state_;
    uint8_t qr_master_secret_[QR_BOOTSTRAP_SECRET_LEN];
    uint8_t derived_ble_oob_[BLE_OOB_VALUE_LEN];
    uint8_t ecdh_shared_secret_[32];
    uint8_t session_key_[32];
    uint64_t last_processed_sequence_;
    provisioning_payload_t pending_payload_;
    nvs_dual_slot_t nvs_storage_;
    bool bootstrap_invalidated_;
    bool is_provisioned_;
};

#endif // BLE_PROVISIONING_H
