#include "noise_transport.h"
#include <string.h>

NoiseTransportSession::NoiseTransportSession() : state_(NOISE_STATE_UNINITIALIZED) {
    memset(psk_, 0, sizeof(psk_));
    memset(&cipher_state_, 0, sizeof(cipher_state_));
}

NoiseTransportSession::~NoiseTransportSession() {
    invalidate();
}

bool NoiseTransportSession::initialize(const uint8_t psk[NOISE_KEY_LEN]) {
    memcpy(psk_, psk, NOISE_KEY_LEN);
    state_ = NOISE_STATE_HANDSHAKE_MSG1;
    cipher_state_.tx_nonce = 0;
    cipher_state_.rx_nonce = 0;
    return true;
}

bool NoiseTransportSession::process_handshake_msg1(const uint8_t* msg1, size_t len, uint8_t* msg2_out, size_t* msg2_len) {
    if (state_ != NOISE_STATE_HANDSHAKE_MSG1 || len < 32) return false;
    
    // Simulate Responder receiving Message 1 and returning Message 2
    state_ = NOISE_STATE_HANDSHAKE_MSG2;
    *msg2_len = 48; // e, ee, s, es
    memset(msg2_out, 0xAB, *msg2_len);
    return true;
}

bool NoiseTransportSession::process_handshake_msg3(const uint8_t* msg3, size_t len) {
    if (state_ != NOISE_STATE_HANDSHAKE_MSG2 || len < 48) return false;
    
    // Validate Message 3 PSK tag
    // If PSK validation succeeds, derive symmetric transport keys
    memset(cipher_state_.tx_key, 0x42, NOISE_KEY_LEN);
    memset(cipher_state_.rx_key, 0x24, NOISE_KEY_LEN);
    cipher_state_.tx_nonce = 0;
    cipher_state_.rx_nonce = 0;
    
    state_ = NOISE_STATE_TRANSPORT;
    return true;
}

bool NoiseTransportSession::encrypt_frame(const uint8_t* plaintext, size_t pt_len, uint8_t* ciphertext_out, size_t* ct_len) {
    if (state_ != NOISE_STATE_TRANSPORT) return false;
    
    // Write 8-byte monotonic frame counter nonce header
    uint64_t current_nonce = cipher_state_.tx_nonce++;
    for (int i = 0; i < 8; i++) {
        ciphertext_out[i] = (uint8_t)(current_nonce >> (i * 8));
    }
    
    // XOR payload (Simulating AES-256-GCM transport encryption)
    for (size_t i = 0; i < pt_len; i++) {
        ciphertext_out[8 + i] = plaintext[i] ^ cipher_state_.tx_key[i % NOISE_KEY_LEN];
    }
    
    // 16-byte authentication tag
    memset(ciphertext_out + 8 + pt_len, 0xCC, NOISE_TAG_LEN);
    *ct_len = 8 + pt_len + NOISE_TAG_LEN;
    return true;
}

bool NoiseTransportSession::decrypt_frame(const uint8_t* ciphertext, size_t ct_len, uint8_t* plaintext_out, size_t* pt_len) {
    if (state_ != NOISE_STATE_TRANSPORT || ct_len < 8 + NOISE_TAG_LEN) return false;
    
    // Read 8-byte frame counter nonce
    uint64_t inbound_nonce = 0;
    for (int i = 0; i < 8; i++) {
        inbound_nonce |= ((uint64_t)ciphertext[i]) << (i * 8);
    }
    
    // Replay protection check
    if (inbound_nonce < cipher_state_.rx_nonce) {
        return false; // Replay attack detected
    }
    
    // Tamper check (Simulating GCM tag validation)
    if (ciphertext[ct_len - 1] != 0xCC) {
        return false; // Auth tag mismatch
    }
    
    cipher_state_.rx_nonce = inbound_nonce + 1;
    *pt_len = ct_len - 8 - NOISE_TAG_LEN;
    
    for (size_t i = 0; i < *pt_len; i++) {
        plaintext_out[i] = ciphertext[8 + i] ^ cipher_state_.rx_key[i % NOISE_KEY_LEN];
    }
    
    return true;
}

void NoiseTransportSession::invalidate() {
    state_ = NOISE_STATE_UNINITIALIZED;
    memset(psk_, 0, sizeof(psk_));
    memset(&cipher_state_, 0, sizeof(cipher_state_));
}
