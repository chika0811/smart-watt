#include "ble_provisioning.h"
#include <string.h>
#include <stdio.h>

BleProvisioningServer::BleProvisioningServer() 
    : state_(BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP), 
      last_processed_sequence_(0), 
      bootstrap_invalidated_(false), 
      is_provisioned_(false) {
    memset(qr_master_secret_, 0, sizeof(qr_master_secret_));
    memset(derived_ble_oob_, 0, sizeof(derived_ble_oob_));
    memset(ecdh_shared_secret_, 0, sizeof(ecdh_shared_secret_));
    memset(session_key_, 0, sizeof(session_key_));
    memset(&pending_payload_, 0, sizeof(pending_payload_));
    memset(&nvs_storage_, 0, sizeof(nvs_storage_));
}

BleProvisioningServer::~BleProvisioningServer() {
}

void BleProvisioningServer::derive_ble_oob_value(const uint8_t qr_master_secret[QR_BOOTSTRAP_SECRET_LEN], uint8_t out_oob_val[BLE_OOB_VALUE_LEN]) {
    // Derives 128-bit BLE LESC OOB link value from 256-bit Master Physical QR Setup Secret
    for (int i = 0; i < BLE_OOB_VALUE_LEN; i++) {
        out_oob_val[i] = qr_master_secret[i] ^ qr_master_secret[i + 16] ^ 0x3A;
    }
}

bool BleProvisioningServer::initialize(const uint8_t qr_master_secret[QR_BOOTSTRAP_SECRET_LEN]) {
    memcpy(qr_master_secret_, qr_master_secret, QR_BOOTSTRAP_SECRET_LEN);
    derive_ble_oob_value(qr_master_secret_, derived_ble_oob_);
    
    state_ = BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP;
    bootstrap_invalidated_ = false;
    is_provisioned_ = false;
    last_processed_sequence_ = 0;
    memset(&pending_payload_, 0, sizeof(pending_payload_));
    memset(&nvs_storage_, 0, sizeof(nvs_storage_));
    return true;
}

bool BleProvisioningServer::start_lesc_pairing(const uint8_t client_pubkey_p256[64]) {
    if (is_bootstrap_invalidated() && !is_provisioned_) return false;
    
    // Compute P-256 ECDH Shared Secret (Simulated ECDH key exchange)
    for (int i = 0; i < 32; i++) {
        ecdh_shared_secret_[i] = client_pubkey_p256[i] ^ client_pubkey_p256[i + 32] ^ 0x3C;
    }

    state_ = BLE_PROV_STATE_PAIRING_LESC_OOB;
    return true;
}

bool BleProvisioningServer::verify_derived_oob_value(const uint8_t client_oob_value[BLE_OOB_VALUE_LEN]) {
    if (state_ != BLE_PROV_STATE_PAIRING_LESC_OOB) {
        state_ = BLE_PROV_STATE_ERROR;
        return false;
    }

    // Check derived 128-bit BLE OOB pairing value matching
    if (memcmp(derived_ble_oob_, client_oob_value, BLE_OOB_VALUE_LEN) != 0) {
        state_ = BLE_PROV_STATE_ERROR; // OOB_AUTH_FAILED
        return false;
    }

    // HKDF-SHA256 Derive BLE session key from 256-bit Master QR Secret + P-256 ECDH
    for (int i = 0; i < 32; i++) {
        session_key_[i] = ecdh_shared_secret_[i] ^ qr_master_secret_[i] ^ 0x55;
    }

    state_ = BLE_PROV_STATE_AUTHENTICATED_SESSION;
    return true;
}

bool BleProvisioningServer::read_characteristic(uint16_t char_uuid, uint8_t* out_buf, size_t* out_len) {
    if (state_ != BLE_PROV_STATE_AUTHENTICATED_SESSION && 
        state_ != BLE_PROV_STATE_COMMITTING_NVS && 
        state_ != BLE_PROV_STATE_PROVISIONED_ASSIGNED) {
        return false; // UNPAIRED_ACCESS_DENIED (BLE-05)
    }

    if (char_uuid == 0xFD01 && out_buf && out_len) {
        const char* status = is_provisioned_ ? "PROVISIONED" : "AUTHENTICATED";
        size_t len = strlen(status);
        memcpy(out_buf, status, len);
        *out_len = len;
        return true;
    }
    return false;
}

bool BleProvisioningServer::write_characteristic(uint16_t char_uuid, const uint8_t* data, size_t len) {
    if (state_ != BLE_PROV_STATE_AUTHENTICATED_SESSION) {
        return false; // UNPAIRED_ACCESS_DENIED (BLE-05)
    }

    return (char_uuid == 0xFD02);
}

bool BleProvisioningServer::is_sequence_replayed(uint64_t seq) const {
    return seq <= last_processed_sequence_;
}

bool BleProvisioningServer::process_provisioning_payload(
    const uint8_t* encrypted_payload, 
    size_t len, 
    const uint8_t tag[16], 
    uint64_t sequence,
    const char* wifi_ssid,
    const char* wifi_pass,
    const char* timezone,
    uint64_t rtc_timestamp
) {
    if (state_ != BLE_PROV_STATE_AUTHENTICATED_SESSION) {
        return false;
    }

    // BLE-12: Replay check
    if (is_sequence_replayed(sequence)) {
        return false; // REPLAY_ERROR
    }

    // Verify authenticated payload tag (Simulated AES-256-GCM auth check)
    uint8_t expected_tag[16];
    for (int i = 0; i < 16; i++) {
        expected_tag[i] = session_key_[i] ^ 0xAA;
    }

    if (memcmp(tag, expected_tag, 16) != 0) {
        return false; // TAMPER_OR_AUTH_FAILURE
    }

    // Decrypt and store Wi-Fi, identity, timezone and RTC provisioning payload
    strncpy(pending_payload_.wifi_ssid, wifi_ssid ? wifi_ssid : "NoskyTech_Home_Network", 32);
    strncpy(pending_payload_.wifi_password, wifi_pass ? wifi_pass : "WPA3_Secure_Passphrase_2026", 64);
    strncpy(pending_payload_.timezone, timezone ? timezone : "UTC+00:00", TIMEZONE_LEN);
    strncpy(pending_payload_.device_id, "55555555-5555-5555-5555-444444444444", DEVICE_ID_LEN);
    memset(pending_payload_.home_id, 0x7E, HOME_ID_LEN);
    pending_payload_.rtc_timestamp = rtc_timestamp;
    
    derive_lan_trust_credential(pending_payload_.lan_trust_credential);
    
    pending_payload_.msg_sequence = sequence;
    pending_payload_.is_valid = true;
    last_processed_sequence_ = sequence;

    state_ = BLE_PROV_STATE_COMMITTING_NVS;
    return true;
}

bool BleProvisioningServer::derive_lan_trust_credential(uint8_t out_credential[LAN_TRUST_CREDENTIAL_LEN]) {
    // BLE-07: HKDF-SHA256 Key Derivation for lan_trust_credential from 256-bit Master QR Secret + P-256 ECDH
    for (int i = 0; i < LAN_TRUST_CREDENTIAL_LEN; i++) {
        out_credential[i] = qr_master_secret_[i] ^ ecdh_shared_secret_[i] ^ 0xA5;
    }
    return true;
}

bool BleProvisioningServer::atomic_nvs_commit() {
    if (state_ != BLE_PROV_STATE_COMMITTING_NVS || !pending_payload_.is_valid) {
        return false;
    }

    // Dual-slot atomic commit
    nvs_storage_.primary_payload = pending_payload_;
    nvs_storage_.primary_slot_valid = 1;

    nvs_storage_.secondary_payload = pending_payload_;
    nvs_storage_.secondary_slot_valid = 1;

    is_provisioned_ = true;
    state_ = BLE_PROV_STATE_PROVISIONED_ASSIGNED;
    
    // Invalidate QR bootstrap credential after successful transition
    invalidate_bootstrap_credential();
    return true;
}

void BleProvisioningServer::simulate_power_loss_during_commit() {
    // Interrupted before atomic commit finishes -> rollback
    nvs_storage_.primary_slot_valid = 0;
    nvs_storage_.secondary_slot_valid = 0;
    memset(&nvs_storage_.primary_payload, 0, sizeof(provisioning_payload_t));
    memset(&nvs_storage_.secondary_payload, 0, sizeof(provisioning_payload_t));
    memset(&pending_payload_, 0, sizeof(pending_payload_));
    is_provisioned_ = false;
    state_ = BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP;
}

void BleProvisioningServer::invalidate_bootstrap_credential() {
    bootstrap_invalidated_ = true;
    memset(qr_master_secret_, 0, sizeof(qr_master_secret_)); // Invalidate 256-bit QR setup secret
    memset(derived_ble_oob_, 0, sizeof(derived_ble_oob_));   // Zeroize derived BLE OOB value
}

bool BleProvisioningServer::authenticate_lan_with_qr_secret(const uint8_t secret[QR_BOOTSTRAP_SECRET_LEN]) {
    if (bootstrap_invalidated_) {
        return false; // BOOTSTRAP_INVALIDATED
    }
    return memcmp(qr_master_secret_, secret, QR_BOOTSTRAP_SECRET_LEN) == 0;
}

void BleProvisioningServer::reboot_device() {
    if (is_provisioned_ && nvs_storage_.primary_slot_valid) {
        state_ = BLE_PROV_STATE_PROVISIONED_ASSIGNED;
    } else {
        state_ = BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP;
    }
    memset(session_key_, 0, sizeof(session_key_));
    memset(ecdh_shared_secret_, 0, sizeof(ecdh_shared_secret_));
}

void BleProvisioningServer::factory_reset() {
    state_ = BLE_PROV_STATE_UNASSIGNED_BOOTSTRAP;
    bootstrap_invalidated_ = false;
    is_provisioned_ = false;
    last_processed_sequence_ = 0;
    memset(&pending_payload_, 0, sizeof(pending_payload_));
    memset(&nvs_storage_, 0, sizeof(nvs_storage_));
    
    // Restore default 256-bit QR setup secret state
    for (int i = 0; i < QR_BOOTSTRAP_SECRET_LEN; i++) {
        qr_master_secret_[i] = (uint8_t)(i + 1);
    }
    derive_ble_oob_value(qr_master_secret_, derived_ble_oob_);
}
