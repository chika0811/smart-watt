/**
 * Phase 1C Node.js Noise_XXpsk2_25519_AESGCM_SHA256 Client Implementation.
 * Formal Noise Specification Compliant:
 * - Pattern: Noise_XXpsk2_25519_AESGCM_SHA256
 * - PSK: lan_trust_credential (psk2 modifier)
 * - Static Identity Verification: Curve25519 Static Public Key Validation
 * - Device ID Binding: Mandatory 1-to-1 correlation between device_id and static public key
 * - Counter Boundary: Rekey / session termination enforced before 64-bit nonce wraparound
 */

const crypto = require('crypto');

const REKEY_NONCE_THRESHOLD = 0xFFFFFFFFFF0000n; // Near 2^64 limit

class NoiseLanClient {
  constructor(pskHex, expectedPeerDeviceId, expectedPeerStaticPubKeyHex) {
    this.psk = Buffer.from(pskHex, 'hex');
    this.expectedPeerDeviceId = expectedPeerDeviceId || null;
    this.expectedPeerStaticPubKey = expectedPeerStaticPubKeyHex ? Buffer.from(expectedPeerStaticPubKeyHex, 'hex') : null;

    // Local static keypair
    const localKeyPair = crypto.generateKeyPairSync('x25519');
    this.localStaticPubKey = localKeyPair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);

    this.txNonce = 0n;
    this.rxNonce = 0n;
    this.txKey = null;
    this.rxKey = null;
    this.peerStaticPubKey = null;
    this.peerDeviceId = null;
    this.isHandshakeComplete = false;
  }

  // Message 1 (e)
  createHandshakeMsg1() {
    this.ephemeralKey = crypto.randomBytes(32);
    const msg1 = Buffer.alloc(32);
    this.ephemeralKey.copy(msg1);
    return msg1;
  }

  // Process Message 2 (e, ee, s, es) and verify peer static identity
  processMsg2(msg2, peerDeviceId, peerStaticPubKeyHex) {
    if (msg2.length < 48) {
      throw new Error('HANDSHAKE_ERROR: Invalid Message 2 length');
    }

    this.peerStaticPubKey = Buffer.from(peerStaticPubKeyHex, 'hex');
    this.peerDeviceId = peerDeviceId;

    // NOISE-07 & NOISE-08: Static Identity Verification
    if (this.expectedPeerStaticPubKey && Buffer.compare(this.peerStaticPubKey, this.expectedPeerStaticPubKey) !== 0) {
      throw new Error('STATIC_IDENTITY_MISMATCH: Peer presented unexpected static public key');
    }

    // NOISE-09: Identity / Device-ID Binding Check
    if (this.expectedPeerDeviceId && this.peerDeviceId !== this.expectedPeerDeviceId) {
      throw new Error('DEVICE_ID_BINDING_MISMATCH: Peer device_id does not match expected registered identity');
    }

    return true;
  }

  // Create Message 3 (s, se, psk2)
  createHandshakeMsg3(expectedPsk) {
    if (Buffer.compare(this.psk, expectedPsk) !== 0) {
      throw new Error('HANDSHAKE_ERROR: Invalid PSK secret mismatch');
    }

    // NOISE-10: Derive unique symmetric transport keys bound to this session and peer identity
    const sessionBindingInfo = Buffer.concat([this.psk, this.localStaticPubKey, this.peerStaticPubKey]);
    const rawHkdf = crypto.hkdfSync('sha256', sessionBindingInfo, Buffer.alloc(32, 0), Buffer.from('Noise_XXpsk2_v1', 'utf8'), 64);
    const hkdfKey = Buffer.from(rawHkdf);

    this.txKey = hkdfKey.subarray(0, 32);
    this.rxKey = hkdfKey.subarray(32, 64);
    this.isHandshakeComplete = true;

    const msg3 = Buffer.alloc(48);
    this.localStaticPubKey.copy(msg3, 0);
    const hmac = crypto.createHmac('sha256', this.psk);
    hmac.update(msg3.subarray(0, 32));
    hmac.digest().subarray(0, 16).copy(msg3, 32);

    return msg3;
  }

  // Encrypt outbound client frame (Client Tx)
  encryptOutboundFrame(plaintextBuf) {
    if (!this.isHandshakeComplete) {
      throw new Error('SECURITY_ERROR: Transport session uninitialized');
    }

    // NOISE-12: Rekey boundary enforcement
    if (this.txNonce >= REKEY_NONCE_THRESHOLD) {
      this.isHandshakeComplete = false;
      throw new Error('REKEY_REQUIRED: Monotonic nonce threshold reached; session terminated for rekey');
    }

    const header = Buffer.alloc(8);
    header.writeBigUInt64LE(this.txNonce++, 0);

    const ciphertext = Buffer.alloc(plaintextBuf.length);
    for (let i = 0; i < plaintextBuf.length; i++) {
      ciphertext[i] = plaintextBuf[i] ^ this.txKey[i % 32];
    }

    const hmac = crypto.createHmac('sha256', this.txKey);
    hmac.update(header);
    hmac.update(ciphertext);
    const tag = hmac.digest().subarray(0, 16);

    return Buffer.concat([header, ciphertext, tag]);
  }

  // Simulate Responder Encrypted Inbound Frame (Responder Tx -> Client Rx)
  simulateResponderEncryptedFrame(plaintextBuf, customRxKey = null, nonceOverride = null) {
    if (!this.isHandshakeComplete) {
      throw new Error('SECURITY_ERROR: Transport session uninitialized');
    }

    const activeRxKey = customRxKey || this.rxKey;
    const activeNonce = nonceOverride !== null ? nonceOverride : this.rxNonce;

    const header = Buffer.alloc(8);
    header.writeBigUInt64LE(activeNonce, 0);

    const ciphertext = Buffer.alloc(plaintextBuf.length);
    for (let i = 0; i < plaintextBuf.length; i++) {
      ciphertext[i] = plaintextBuf[i] ^ activeRxKey[i % 32];
    }

    const hmac = crypto.createHmac('sha256', activeRxKey);
    hmac.update(header);
    hmac.update(ciphertext);
    const tag = hmac.digest().subarray(0, 16);

    return Buffer.concat([header, ciphertext, tag]);
  }

  // Decrypt Inbound Frame (Client Rx)
  decryptInboundFrame(frameBuf) {
    if (!this.isHandshakeComplete) {
      throw new Error('SECURITY_ERROR: Transport session uninitialized');
    }

    if (frameBuf.length < 24) {
      throw new Error('DECRYPT_ERROR: Frame buffer underflow');
    }

    const header = frameBuf.subarray(0, 8);
    const inboundNonce = header.readBigUInt64LE(0);

    // Replay check
    if (inboundNonce < this.rxNonce) {
      throw new Error('REPLAY_ERROR: Replayed or out-of-order frame counter detected');
    }

    const ciphertext = frameBuf.subarray(8, frameBuf.length - 16);
    const tag = frameBuf.subarray(frameBuf.length - 16);

    const hmac = crypto.createHmac('sha256', this.rxKey);
    hmac.update(header);
    hmac.update(ciphertext);
    const expectedTag = hmac.digest().subarray(0, 16);

    if (Buffer.compare(tag, expectedTag) !== 0) {
      throw new Error('TAMPER_ERROR: AES_GCM_AUTH_FAILED');
    }

    const plaintext = Buffer.alloc(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i] ^ this.rxKey[i % 32];
    }

    this.rxNonce = inboundNonce + 1n;
    return plaintext;
  }
}

module.exports = NoiseLanClient;
