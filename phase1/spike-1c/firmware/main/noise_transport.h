#ifndef NOISE_TRANSPORT_H
#define NOISE_TRANSPORT_H

#include <stdint.h>
#include <stddef.h>

#define NOISE_KEY_LEN 32
#define NOISE_TAG_LEN 16
#define NOISE_MAX_PAYLOAD 1024

typedef enum {
    NOISE_STATE_UNINITIALIZED,
    NOISE_STATE_HANDSHAKE_MSG1,
    NOISE_STATE_HANDSHAKE_MSG2,
    NOISE_STATE_HANDSHAKE_MSG3,
    NOISE_STATE_TRANSPORT
} noise_session_state_t;

typedef struct {
    uint8_t tx_key[NOISE_KEY_LEN];
    uint8_t rx_key[NOISE_KEY_LEN];
    uint64_t tx_nonce;
    uint64_t rx_nonce;
} noise_cipher_state_t;

class NoiseTransportSession {
public:
    NoiseTransportSession();
    ~NoiseTransportSession();

    bool initialize(const uint8_t psk[NOISE_KEY_LEN]);
    bool process_handshake_msg1(const uint8_t* msg1, size_t len, uint8_t* msg2_out, size_t* msg2_len);
    bool process_handshake_msg3(const uint8_t* msg3, size_t len);

    bool encrypt_frame(const uint8_t* plaintext, size_t pt_len, uint8_t* ciphertext_out, size_t* ct_len);
    bool decrypt_frame(const uint8_t* ciphertext, size_t ct_len, uint8_t* plaintext_out, size_t* pt_len);

    noise_session_state_t get_state() const { return state_; }
    void invalidate();

private:
    noise_session_state_t state_;
    uint8_t psk_[NOISE_KEY_LEN];
    uint8_t static_key_[NOISE_KEY_LEN];
    uint8_t ephemeral_key_[NOISE_KEY_LEN];
    noise_cipher_state_t cipher_state_;
};

#endif // NOISE_TRANSPORT_H
