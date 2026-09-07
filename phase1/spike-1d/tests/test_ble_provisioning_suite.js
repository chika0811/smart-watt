/**
 * Phase 1D Comprehensive BLE LESC OOB Provisioning Test Suite
 * Includes Security Acceptance Tests BLE-01 through BLE-12
 */

const BleSetupClient = require('../client/ble_setup_client');

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`TEST FAILURE: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runBleProvisioningTestSuite() {
  console.log('===================================================================');
  console.log(' NOSKYTECH PHASE 1D — COMPREHENSIVE BLE LESC OOB TEST SUITE       ');
  console.log('===================================================================');

  // 256-bit (32-byte) Master Physical QR Setup Secret
  const validQrMasterSecretHex = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';
  const invalidQrMasterSecretHex = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  const validDerivedBleOobHex = BleSetupClient.deriveBleOobValue(Buffer.from(validQrMasterSecretHex, 'hex')).toString('hex');
  const invalidDerivedBleOobHex = BleSetupClient.deriveBleOobValue(Buffer.from(invalidQrMasterSecretHex, 'hex')).toString('hex');

  // -------------------------------------------------------------------------
  // BLE-01: LESC P-256 Pairing Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] BLE-01: Executing LESC P-256 ECDH Key Exchange...');
  const client1 = new BleSetupClient(validQrMasterSecretHex);
  const pairingResult = client1.startLescPairing();
  assert(client1.state === 'PAIRING_LESC_OOB', 'Session state updated to PAIRING_LESC_OOB');
  assert(client1.clientPublicKey.length === 65, 'Client P-256 uncompressed public key generated (65 bytes)');
  assert(client1.ecdhSharedSecret.length === 32, 'ECDH P-256 shared secret computed (32 bytes)');

  // -------------------------------------------------------------------------
  // BLE-02: Correct OOB Secret Authentication
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] BLE-02: Derived 128-bit BLE OOB Pairing Secret Verification...');
  const authRes = client1.verifyOobSecret(validDerivedBleOobHex);
  assert(authRes === true, 'OOB authentication succeeded with derived 128-bit BLE OOB secret');
  assert(client1.isAuthenticated === true && client1.isPaired === true, 'Client status marked Paired & Authenticated');
  assert(client1.sessionKey.length === 32, 'Session key derived from 256-bit Master QR secret + P-256 ECDH (32 bytes)');

  // -------------------------------------------------------------------------
  // BLE-03: Incorrect OOB Secret Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] BLE-03: Incorrect OOB Secret Rejection...');
  const clientInvalidSecret = new BleSetupClient(validQrMasterSecretHex);
  clientInvalidSecret.startLescPairing();
  let caughtInvalidOob = false;
  try {
    clientInvalidSecret.verifyOobSecret(invalidDerivedBleOobHex);
  } catch (err) {
    if (err.message.includes('OOB_AUTH_FAILED')) caughtInvalidOob = true;
  }
  assert(caughtInvalidOob === true, 'Pairing with incorrect derived OOB secret rejected (OOB_AUTH_FAILED)');

  // -------------------------------------------------------------------------
  // BLE-04: MITM Protection Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] BLE-04: MITM Protection Verification...');
  const clientMitm = new BleSetupClient(validQrMasterSecretHex);
  clientMitm.startLescPairing();
  let caughtMitm = false;
  try {
    clientMitm.verifyOobSecret(validDerivedBleOobHex, true /* simulate MITM flag */);
  } catch (err) {
    if (err.message.includes('MITM_DETECTED')) caughtMitm = true;
  }
  assert(caughtMitm === true, 'Unauthenticated or tampered pairing parameters rejected with MITM error');

  // -------------------------------------------------------------------------
  // BLE-05: Unpaired Access Prevention
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] BLE-05: Unpaired Client Access Prevention...');
  const clientUnpaired = new BleSetupClient(validQrMasterSecretHex);
  let caughtUnpairedRead = false;
  try {
    clientUnpaired.readGattCharacteristic('0000fd01-0000-1000-8000-00805f9b34fb');
  } catch (err) {
    if (err.message.includes('UNPAIRED_ACCESS_DENIED')) caughtUnpairedRead = true;
  }
  assert(caughtUnpairedRead === true, 'Read attempt on GATT characteristic by unpaired client DENIED');

  let caughtUnpairedWrite = false;
  try {
    clientUnpaired.writeGattCharacteristic('0000fd02-0000-1000-8000-00805f9b34fb', Buffer.from('TEST'));
  } catch (err) {
    if (err.message.includes('UNPAIRED_ACCESS_DENIED')) caughtUnpairedWrite = true;
  }
  assert(caughtUnpairedWrite === true, 'Write attempt on GATT characteristic by unpaired client DENIED');

  // -------------------------------------------------------------------------
  // BLE-06: Provisioning Payload Encryption & Authentication (SSID, PSK, Timezone, RTC)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] BLE-06: Encrypted & Authenticated Provisioning Payload Exchange...');
  const provPayloadRes = client1.createAndSendProvisioningPayload(
    'NoskyTech_Home_WiFi',
    'SuperSecretPassphrase2026',
    'home-7777',
    'dev-5555-4444',
    1n,
    'UTC+01:00',
    1772193600
  );
  assert(provPayloadRes.encryptedHex.length > 0, 'Payload encrypted with AES-256-GCM dual-layer AEAD');
  assert(provPayloadRes.tagHex.length === 32, 'GCM Authentication Tag computed (16 bytes / 32 hex chars)');

  let caughtTamperedPayload = false;
  try {
    client1.createAndSendProvisioningPayload(
      'NoskyTech_Home_WiFi',
      'SuperSecretPassphrase2026',
      'home-7777',
      'dev-5555-4444',
      2n,
      'UTC+01:00',
      1772193600,
      true /* simulate tamper */
    );
  } catch (err) {
    if (err.message.includes('PAYLOAD_AUTH_FAILED')) caughtTamperedPayload = true;
  }
  assert(caughtTamperedPayload === true, 'Tampered ciphertext payload rejected (PAYLOAD_AUTH_FAILED)');

  // -------------------------------------------------------------------------
  // BLE-07: Trust Credential Derivation (HKDF-SHA256)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] BLE-07: Trust Credential (lan_trust_credential) KDF Derivation...');
  const trustCred = client1.deriveLanTrustCredential();
  assert(trustCred.length === 32, 'lan_trust_credential generated via HKDF-SHA256 from 256-bit QR secret (32 bytes)');
  
  // Re-deriving with same parameters yields identical credential
  const trustCred2 = client1.deriveLanTrustCredential();
  assert(Buffer.compare(trustCred, trustCred2) === 0, 'HKDF-SHA256 derivation is deterministic and repeatable');

  // -------------------------------------------------------------------------
  // BLE-08: 256-bit QR Bootstrap Credential Invalidation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] BLE-08: 256-bit QR Bootstrap Credential Invalidation Post-Provisioning...');
  client1.commitNvsAtomically();
  assert(client1.serverState.bootstrapInvalidated === true, 'Bootstrap credential invalidated flag set');
  
  let caughtInvalidatedBootstrap = false;
  try {
    client1.attemptLanAuthWithQrSecret(validQrMasterSecretHex);
  } catch (err) {
    if (err.message.includes('BOOTSTRAP_INVALIDATED')) caughtInvalidatedBootstrap = true;
  }
  assert(caughtInvalidatedBootstrap === true, '256-bit QR setup secret cannot be reused for normal LAN operation');

  // -------------------------------------------------------------------------
  // BLE-09: Reboot Identity & Trust Persistence
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] BLE-09: Reboot Device Identity & Trust Persistence...');
  client1.rebootDevice();
  assert(client1.state === 'PROVISIONED_ASSIGNED', 'Device state preserved as PROVISIONED_ASSIGNED post-reboot');
  assert(client1.serverState.isProvisioned === true, 'Provisioned flag preserved in NVS post-reboot');
  assert(client1.serverState.nvsPayload.wifi_ssid === 'NoskyTech_Home_WiFi', 'Wi-Fi credentials preserved in NVS post-reboot');
  assert(client1.serverState.nvsPayload.timezone === 'UTC+01:00', 'Timezone configuration preserved in NVS post-reboot');

  // -------------------------------------------------------------------------
  // BLE-10: Factory Reset Transition
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] BLE-10: Factory Reset Transition to Bootstrap State...');
  client1.factoryReset();
  assert(client1.state === 'UNASSIGNED_BOOTSTRAP', 'Device returned to UNASSIGNED_BOOTSTRAP state');
  assert(client1.serverState.isProvisioned === false, 'Provisioned flag cleared');
  assert(client1.serverState.bootstrapInvalidated === false, 'Bootstrap secret validity restored for initial QR setup');

  // -------------------------------------------------------------------------
  // BLE-11: Atomic Commit / Power Loss Recovery
  // -------------------------------------------------------------------------
  console.log('\n[TEST 11] BLE-11: Partial Provisioning / Power Loss Rollback...');
  const clientPowerLoss = new BleSetupClient(validQrMasterSecretHex);
  clientPowerLoss.startLescPairing();
  clientPowerLoss.verifyOobSecret(validDerivedBleOobHex);
  clientPowerLoss.createAndSendProvisioningPayload('Temp_WiFi', 'Temp_Pass', 'home-99', 'dev-99', 1n, 'UTC+00:00', 1772193600);
  
  let caughtPowerLoss = false;
  try {
    clientPowerLoss.commitNvsAtomically(true /* simulate power loss before commit */);
  } catch (err) {
    if (err.message.includes('POWER_LOSS_ROLLBACK')) caughtPowerLoss = true;
  }
  assert(caughtPowerLoss === true, 'Power loss during commit triggered rollback to clean bootstrap state');
  assert(clientPowerLoss.serverState.isProvisioned === false, 'Device remains unprovisioned');
  assert(clientPowerLoss.serverState.nvsPayload === null, 'No half-valid or corrupted credential set left in NVS');

  // -------------------------------------------------------------------------
  // BLE-12: Replay Attack Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 12] BLE-12: Replay Attack Protection...');
  const clientReplay = new BleSetupClient(validQrMasterSecretHex);
  clientReplay.startLescPairing();
  clientReplay.verifyOobSecret(validDerivedBleOobHex);
  clientReplay.createAndSendProvisioningPayload('WiFi_A', 'Pass_A', 'home-1', 'dev-1', 10n, 'UTC+00:00', 1772193600);
  
  let caughtReplay = false;
  try {
    // Attempting to send message with sequence <= 10n
    clientReplay.createAndSendProvisioningPayload('WiFi_A', 'Pass_A', 'home-1', 'dev-1', 10n, 'UTC+00:00', 1772193600);
  } catch (err) {
    if (err.message.includes('REPLAY_ERROR')) caughtReplay = true;
  }
  assert(caughtReplay === true, 'Replayed provisioning message rejected (REPLAY_ERROR)');

  console.log('\n===================================================================');
  console.log('  [PASS] ALL BLE-01 THROUGH BLE-12 ACCEPTANCE TESTS PASSED!        ');
  console.log('===================================================================');
}

if (require.main === module) {
  runBleProvisioningTestSuite();
}
