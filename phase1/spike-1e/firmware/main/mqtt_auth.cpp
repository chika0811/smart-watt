#include "mqtt_auth.h"
#include <stdio.h>
#include <string.h>

Mqtt5AuthClient::Mqtt5AuthClient() : state_(MQTT_AUTH_STATE_UNAUTHENTICATED) {
    memset(device_id_, 0, sizeof(device_id_));
    memset(home_id_, 0, sizeof(home_id_));
    memset(rsa_private_key_mock_, 0x7E, sizeof(rsa_private_key_mock_));
}

Mqtt5AuthClient::~Mqtt5AuthClient() {
}

bool Mqtt5AuthClient::initialize(const char* device_id, const char* home_id) {
    if (!device_id || !home_id) return false;
    strncpy(device_id_, device_id, sizeof(device_id_) - 1);
    strncpy(home_id_, home_id, sizeof(home_id_) - 1);
    state_ = MQTT_AUTH_STATE_UNAUTHENTICATED;
    return true;
}

size_t Mqtt5AuthClient::build_auth_transcript(
    const mqtt5_auth_challenge_t* challenge, 
    char* out_transcript_buf, 
    size_t max_buf_len
) {
    if (!challenge || !out_transcript_buf || max_buf_len == 0) return 0;

    char nonce_hex[CHALLENGE_NONCE_LEN * 2 + 1] = {0};
    for (int i = 0; i < CHALLENGE_NONCE_LEN; i++) {
        sprintf(nonce_hex + (i * 2), "%02x", challenge->challenge_nonce[i]);
    }

    int len = snprintf(
        out_transcript_buf, 
        max_buf_len,
        "NOSKY-MQTT5-AUTH-v1:%s:%s:%s:%s:%llu:%s",
        challenge->device_id,
        challenge->home_id,
        challenge->session_id,
        nonce_hex,
        (unsigned long long)challenge->timestamp,
        challenge->broker_domain
    );

    return (len > 0 && (size_t)len < max_buf_len) ? (size_t)len : 0;
}

bool Mqtt5AuthClient::sign_transcript_rsa_pss(
    const char* transcript, 
    size_t transcript_len, 
    uint8_t out_sig[SIGNATURE_LEN_BYTES]
) {
    if (!transcript || transcript_len == 0 || !out_sig) return false;

    // Simulated RSA-3072 PSS signature calculation using mbedTLS / DS Peripheral logic
    for (int i = 0; i < SIGNATURE_LEN_BYTES; i++) {
        out_sig[i] = (uint8_t)(transcript[i % transcript_len] ^ rsa_private_key_mock_[i] ^ 0x3C);
    }

    state_ = MQTT_AUTH_STATE_RESPONSE_SENT;
    return true;
}

bool Mqtt5AuthClient::is_topic_permitted(const char* home_id, const char* device_id, const char* topic, bool is_publish) {
    if (state_ != MQTT_AUTH_STATE_AUTHENTICATED) return false;
    if (strcmp(home_id, home_id_) != 0 || strcmp(device_id, device_id_) != 0) return false;

    char telemetry_topic[128];
    char commands_topic[128];
    char state_topic[128];

    snprintf(telemetry_topic, sizeof(telemetry_topic), "nosky/%s/devices/%s/telemetry", home_id_, device_id_);
    snprintf(commands_topic, sizeof(commands_topic), "nosky/%s/devices/%s/commands", home_id_, device_id_);
    snprintf(state_topic, sizeof(state_topic), "nosky/%s/devices/%s/state", home_id_, device_id_);

    if (is_publish) {
        return (strcmp(topic, telemetry_topic) == 0 || strcmp(topic, state_topic) == 0);
    } else {
        return (strcmp(topic, commands_topic) == 0 || strcmp(topic, state_topic) == 0);
    }
}
