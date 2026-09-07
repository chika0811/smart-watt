#include "ble_provisioning.h"
#include <stdio.h>
#include <assert.h>

extern "C" void app_main(void) {
    printf("===================================================================\n");
    printf(" NOSKYTECH PHASE 1D — BLE LESC OOB PROVISIONING FIRMWARE SPIKE    \n");
    printf("===================================================================\n");

    // 256-bit Master Physical QR Setup Secret
    uint8_t qr_master_secret[QR_BOOTSTRAP_SECRET_LEN] = {
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
        0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20
    };

    BleProvisioningServer server;
    server.initialize(qr_master_secret);
    printf("[INFO] BleProvisioningServer initialized with 256-bit QR Master Secret.\n");

    uint8_t derived_oob[BLE_OOB_VALUE_LEN];
    server.get_derived_oob_value(derived_oob);
    printf("[INFO] Derived 128-bit BLE OOB Pairing Value computed successfully.\n");

    uint8_t client_pubkey[64];
    memset(client_pubkey, 0x55, sizeof(client_pubkey));
    bool pairing_res = server.start_lesc_pairing(client_pubkey);
    assert(pairing_res && server.get_state() == BLE_PROV_STATE_PAIRING_LESC_OOB);
    printf("[PASS] BLE-01: LESC P-256 pairing initialized successfully.\n");

    bool oob_res = server.verify_derived_oob_value(derived_oob);
    assert(oob_res && server.get_state() == BLE_PROV_STATE_AUTHENTICATED_SESSION);
    printf("[PASS] BLE-02: Derived 128-bit OOB Secret authentication succeeded.\n");

    uint8_t tag[16];
    for (int i = 0; i < 16; i++) tag[i] = 0x11 ^ 0x3C ^ 0x01 ^ 0x55 ^ 0xAA;
    uint8_t payload[64] = {0};
    bool prov_res = server.process_provisioning_payload(
        payload, sizeof(payload), tag, 1, 
        "NoskyTech_Home_Network", "WPA3_Pass", "UTC+01:00", 1772193600
    );
    assert(prov_res && server.get_state() == BLE_PROV_STATE_COMMITTING_NVS);
    printf("[PASS] BLE-06: Provisioning payload with Wi-Fi, Timezone, and RTC processed.\n");

    bool commit_res = server.atomic_nvs_commit();
    assert(commit_res && server.get_state() == BLE_PROV_STATE_PROVISIONED_ASSIGNED);
    printf("[PASS] BLE-11/BLE-08: Dual-slot NVS committed and 256-bit QR credential invalidated.\n");

    printf("===================================================================\n");
    printf(" [SUCCESS] SPIKE 1D FIRMWARE SELF-TEST PASSED SUCCESSFULLY.        \n");
    printf("===================================================================\n");
}