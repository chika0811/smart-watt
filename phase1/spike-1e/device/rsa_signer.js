/**
 * Phase 1E Device Hardware Identity & RSA-3072 PSS Signer (Simulated ESP32-S3 Security Boundary).
 * 
 * Simulates ESP32-S3 Hardware Security Peripheral (RSA-3072 DS Peripheral + eFuse HMAC key).
 * The device private signing key never leaves this module boundary.
 */

const crypto = require('crypto');

class RsaSigner {
  constructor(deviceId) {
    this.deviceId = deviceId;

    // Generate RSA-3072 Bit Keypair (Hardware Identity)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 3072,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.publicKeyPem = publicKey;
    this._privateKeyPem = privateKey; // Private Key isolated inside boundary
  }

  getPublicKeyPem() {
    return this.publicKeyPem;
  }

  // Sign authentication transcript string using RSA-3072 PSS + SHA-256
  signTranscript(transcriptStr) {
    const signer = crypto.createSign('sha256');
    signer.update(transcriptStr, 'utf8');

    const signature = signer.sign({
      key: this._privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    });

    return signature.toString('hex');
  }
}

module.exports = RsaSigner;
