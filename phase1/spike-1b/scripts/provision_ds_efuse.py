"""
Phase 1B — ESP32-S3 eFuse HMAC Key Provisioning & DS Data Generation Automation Script
"""

import sys
import os

def print_provisioning_workflow():
    print("===================================================================")
    print(" NOSKYTECH PHASE 1B — ESP32-S3 HARDWARE DS PROVISIONING PROCEDURE")
    print("===================================================================")
    print("""
Step 1: Generate 256-bit Random eFuse HMAC Key
  $ openssl rand -out hmac_key.bin 32

Step 2: Generate RSA-3072 Device Keypair
  $ openssl genrsa -out device_private_key.pem 3072
  $ openssl rsa -in device_private_key.pem -pubout -out device_public_key.pem

Step 3: Burn HMAC Key to ESP32-S3 eFuse Block 4 (Purpose: HMAC_DOWN_DIGITAL_SIGNATURE)
  $ espefuse.py --port /dev/ttyUSB0 burn_key BLOCK_KEY4 hmac_key.bin HMAC_DOWN_DIGITAL_SIGNATURE

Step 4: Calculate Encrypted DS Flash Parameter Block (esp_ds_data_t)
  $ python -m esp_secure_cert_tool.esp_secure_cert_helper \\
      --priv_key device_private_key.pem \\
      --hmac_key hmac_key.bin \\
      --output_file ds_encrypted_params.bin

Step 5: Flash Encrypted DS Parameter Block to NVS Partition
  $ esptool.py --port /dev/ttyUSB0 write_flash 0x10000 ds_encrypted_params.bin

Result: Hardware RSA-3072 signing is operational; private key is hardware-encrypted.
""")

if __name__ == "__main__":
    print_provisioning_workflow()
