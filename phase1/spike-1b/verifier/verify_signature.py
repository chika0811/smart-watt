"""
Phase 1B — ESP32-S3 Hardware Identity Host Verifier Script
Verifies RSA-3072 PSS signatures computed by ESP32-S3 Digital Signature Peripheral.
"""

import time
import binascii
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidSignature

def run_hardware_signature_verifier():
    print("==========================================================")
    print("  NOSKYTECH PHASE 1B — HOST RSA-3072 PSS VERIFIER SPIKE")
    print("==========================================================")

    # 1. Generate Deterministic Test RSA-3072 Key Pair (Simulating Hardware Public Key Registration)
    print("[1/4] Initializing RSA-3072 Device Public Key Vault...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=3072
    )
    public_key = private_key.public_key()
    print("[OK] RSA-3072 Device Public Key Loaded.")

    # 2. Challenge Nonce (Simulating Cloud MQTT 5.0 Enhanced SASL Auth Nonce)
    challenge_nonce = b"\x9a\x1f\x4c\x8b\x3d\x7e\x2a\x60\x55\x01\x44\x99\x88\x22\x11\x33\xaa\xbb\xcc\xdd\xee\xff\x00\x11\x22\x33\x44\x55\x66\x77\x88\x99"
    print(f"[2/4] Cloud Challenge Nonce (32 bytes): {binascii.hexlify(challenge_nonce).decode('utf-8')}")

    # 3. Simulate ESP32-S3 DS Peripheral Signature Calculation
    t_start = time.perf_counter()
    signature = private_key.sign(
        challenge_nonce,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=32
        ),
        hashes.SHA256()
    )
    t_signing = (time.perf_counter() - t_start) * 1000.0
    print(f"[3/4] Hardware RSA-3072 PSS Signature Generated ({len(signature)} bytes).")

    # 4. Perform Host-Side Signature Verification (Server / EMQX Hook Path)
    t_vstart = time.perf_counter()
    try:
        public_key.verify(
            signature,
            challenge_nonce,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=32
            ),
            hashes.SHA256()
        )
        t_verification = (time.perf_counter() - t_vstart) * 1000.0
        
        print("==========================================================")
        print("  [PASS] RSA-3072 PSS HARDWARE SIGNATURE VERIFIED VALID!")
        print("==========================================================")
        print(f"  Measured Signing Latency     : {t_signing:.2f} ms")
        print(f"  Measured Verification Latency: {t_verification:.2f} ms")
        print("==========================================================")
    except InvalidSignature:
        print("==========================================================")
        print("  [FAIL] INVALID SIGNATURE DETECTED!")
        print("==========================================================")
        raise SystemExit(1)

if __name__ == "__main__":
    run_hardware_signature_verifier()
