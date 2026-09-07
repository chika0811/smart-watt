#include "mqtt_auth.h"
#include <stdio.h>
#include <string.h>
#include <assert.h>

extern "C" void app_main(void) {
    printf("===================================================================\n");
    printf(" NOSKYTECH PHASE 1E — ESP32-S3 MQTT 5.0 ENHANCED AUTH SPIKE        \n");
    printf("===================================================================\n");

    Mqtt5AuthClient client;
    bool init_res = client.initialize("55555555-5555-5555-5555-444444444444", "home-1111");
    assert(init_res && client.get_state() == MQTT_AUTH_STATE_UNAUTHENTICATED);
    printf("[INFO] Mqtt5AuthClient initialized with RSA-3072 PSS identity.\n");

    mqtt5_auth_challenge_t challenge;
    strncpy(challenge.device_id, "55555555-5555-5555-5555-444444444444", 36);
    strncpy(challenge.home_id, "home-1111", 36);
    strncpy(challenge.session_id, "sess-88776655", 31);
    memset(challenge.challenge_nonce, 0xA5, 32);
    challenge.timestamp = 1772193600;
    strncpy(challenge.broker_domain, "mqtt.noskytech.com", 63);

    char transcript_buf[512] = {0};
    size_t transcript_len = client.build_auth_transcript(&challenge, transcript_buf, sizeof(transcript_buf));
    assert(transcript_len > 0);
    printf("[INFO] Transcript constructed: %s\n", transcript_buf);

    uint8_t sig[SIGNATURE_LEN_BYTES] = {0};
    bool sign_res = client.sign_transcript_rsa_pss(transcript_buf, transcript_len, sig);
    assert(sign_res && client.get_state() == MQTT_AUTH_STATE_RESPONSE_SENT);
    printf("[PASS] RSA-3072 PSS signature computed (384 bytes / 3072 bits).\n");

    client.set_state(MQTT_AUTH_STATE_AUTHENTICATED);
    bool acl_pub = client.is_topic_permitted("home-1111", "55555555-5555-5555-5555-444444444444", "nosky/home-1111/devices/55555555-5555-5555-5555-444444444444/telemetry", true);
    assert(acl_pub == true);
    printf("[PASS] Telemetry topic authorization verified for home-1111.\n");

    bool acl_cross = client.is_topic_permitted("home-2222", "55555555-5555-5555-5555-444444444444", "nosky/home-2222/devices/55555555-5555-5555-5555-444444444444/telemetry", true);
    assert(acl_cross == false);
    printf("[PASS] Cross-home topic access (home-2222) strictly DENIED.\n");

    printf("===================================================================\n");
    printf(" [SUCCESS] SPIKE 1E FIRMWARE SELF-TEST PASSED SUCCESSFULLY.        \n");
    printf("===================================================================\n");
}
