#ifndef MQTT_AUTH_H
#define MQTT_AUTH_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define RSA_KEY_SIZE_BITS 3072
#define RSA_KEY_SIZE_BYTES (RSA_KEY_SIZE_BITS / 8)
#define SIGNATURE_LEN_BYTES RSA_KEY_SIZE_BYTES
#define CHALLENGE_NONCE_LEN 32

typedef enum {
    MQTT_AUTH_STATE_UNAUTHENTICATED = 0,
    MQTT_AUTH_STATE_CHALLENGE_RECEIVED,
    MQTT_AUTH_STATE_RESPONSE_SENT,
    MQTT_AUTH_STATE_AUTHENTICATED,
    MQTT_AUTH_STATE_REJECTED
} mqtt_auth_state_t;

typedef struct {
    char device_id[37];
    char home_id[37];
    char session_id[32];
    uint8_t challenge_nonce[CHALLENGE_NONCE_LEN];
    uint64_t timestamp;
    char broker_domain[64];
} mqtt5_auth_challenge_t;

// ESP32-S3 Firmware RSA-3072 PSS MQTT 5.0 Enhanced Auth Class
class Mqtt5AuthClient {
public:
    Mqtt5AuthClient();
    ~Mqtt5AuthClient();

    bool initialize(const char* device_id, const char* home_id);
    
    // Process SASL Challenge & Construct Auth Transcript
    size_t build_auth_transcript(
        const mqtt5_auth_challenge_t* challenge, 
        char* out_transcript_buf, 
        size_t max_buf_len
    );

    // Compute RSA-3072 PSS Signature using ESP32-S3 DS Peripheral / mbedTLS
    bool sign_transcript_rsa_pss(
        const char* transcript, 
        size_t transcript_len, 
        uint8_t out_sig[SIGNATURE_LEN_BYTES]
    );

    // Verify topic authorization scope
    bool is_topic_permitted(const char* home_id, const char* device_id, const char* topic, bool is_publish);

    mqtt_auth_state_t get_state() const { return state_; }
    void set_state(mqtt_auth_state_t state) { state_ = state; }

private:
    char device_id_[37];
    char home_id_[37];
    mqtt_auth_state_t state_;
    uint8_t rsa_private_key_mock_[RSA_KEY_SIZE_BYTES];
};

#ifdef __cplusplus
}
#endif

#endif // MQTT_AUTH_H
