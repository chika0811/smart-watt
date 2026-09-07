/**
 * Phase 1C Comprehensive Noise_XXpsk2 LAN Transport Test Suite
 * Includes Security Acceptance Tests NOISE-01 through NOISE-12
 */

const NoiseLanClient = require('../client/noise_lan_client');

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`TEST FAILURE: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runNoiseLanTestSuite() {
  console.log('===================================================================');
  console.log(' NOSKYTECH PHASE 1C — COMPREHENSIVE NOISE_XXpsk2 LAN TEST SUITE   ');
  console.log('===================================================================');

  const pskHex = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
  const invalidPskHex = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  const devA_Id = '55555555-5555-5555-5555-111111111111';
  const devA_PubKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  const devB_Id = '55555555-5555-5555-5555-333333333333';
  const devB_PubKey = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  // -------------------------------------------------------------------------
  // NOISE-01: Full 3-Message Handshake Execution
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] NOISE-01: Executing 3-Message Noise Handshake with Valid PSK...');
  const client1 = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  const msg1 = client1.createHandshakeMsg1();
  assert(msg1.length === 32, 'Message 1 length is 32 bytes (Ephemeral Key)');

  client1.processMsg2(Buffer.alloc(48, 0xAB), devA_Id, devA_PubKey);
  const msg3 = client1.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));
  assert(msg3.length === 48, 'Message 3 length is 48 bytes (Static Key & psk2 Tag)');
  assert(client1.isHandshakeComplete === true, 'Handshake status set to COMPLETE');

  // -------------------------------------------------------------------------
  // NOISE-02: NDP v1 Encrypted Frame Exchange
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] NOISE-02: NDP v1 Encrypted Frame Exchange...');
  const ndpPayload = JSON.stringify({ v: 1, msg_id: 'cmd-1', type: 'CMD', payload: { relay: 1, state: true } });
  const encryptedFrame = client1.simulateResponderEncryptedFrame(Buffer.from(ndpPayload, 'utf8'));
  const decryptedText = client1.decryptInboundFrame(encryptedFrame).toString('utf8');
  assert(decryptedText === ndpPayload, 'Decrypted plaintext payload matches original NDP v1 frame');

  // -------------------------------------------------------------------------
  // NOISE-03: Replay Attack Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] NOISE-03: Replay Attack Protection Verification...');
  let caughtReplayError = false;
  try {
    client1.decryptInboundFrame(encryptedFrame);
  } catch (err) {
    if (err.message.includes('REPLAY_ERROR')) caughtReplayError = true;
  }
  assert(caughtReplayError === true, 'Replayed transport ciphertext frame rejected');

  // -------------------------------------------------------------------------
  // NOISE-04: Tampered Ciphertext Protection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] NOISE-04: Tampered Ciphertext Verification...');
  const tamperedFrame = client1.simulateResponderEncryptedFrame(Buffer.from('PAYLOAD', 'utf8'));
  tamperedFrame[10] ^= 0xFF; // Flip 1 bit
  let caughtTamperError = false;
  try {
    client1.decryptInboundFrame(tamperedFrame);
  } catch (err) {
    if (err.message.includes('TAMPER_ERROR')) caughtTamperError = true;
  }
  assert(caughtTamperError === true, 'Tampered ciphertext rejected (AES_GCM_AUTH_FAILED)');

  // -------------------------------------------------------------------------
  // NOISE-05: Handshake with Invalid PSK
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] NOISE-05: Invalid PSK Handshake Protection...');
  let caughtInvalidPskError = false;
  try {
    const invalidClient = new NoiseLanClient(invalidPskHex);
    invalidClient.createHandshakeMsg1();
    invalidClient.processMsg2(Buffer.alloc(48, 0xAB), devA_Id, devA_PubKey);
    invalidClient.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));
  } catch (err) {
    if (err.message.includes('HANDSHAKE_ERROR')) caughtInvalidPskError = true;
  }
  assert(caughtInvalidPskError === true, 'Handshake with invalid PSK rejected');

  // -------------------------------------------------------------------------
  // NOISE-06: Reboot Invalidation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] NOISE-06: Session Reboot Invalidation...');
  client1.isHandshakeComplete = false;
  let caughtUninitError = false;
  try {
    client1.encryptOutboundFrame(Buffer.from('POST_REBOOT', 'utf8'));
  } catch (err) {
    if (err.message.includes('SECURITY_ERROR')) caughtUninitError = true;
  }
  assert(caughtUninitError === true, 'Stale session post-reboot rejected; requires fresh handshake');

  // -------------------------------------------------------------------------
  // NOISE-07: Static Identity Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] NOISE-07: Static Identity Verification (Device A vs Device B)...');
  const clientDevA = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  clientDevA.createHandshakeMsg1();
  // Client expecting Device A receives Device A's static key -> PASS
  assert(clientDevA.processMsg2(Buffer.alloc(48), devA_Id, devA_PubKey) === true, 'Connecting to expected Device A static key PASSES');

  const clientDevExpectA = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  clientDevExpectA.createHandshakeMsg1();
  let caughtStaticMismatch = false;
  try {
    // Client expecting Device A receives Device B's static key -> FAIL
    clientDevExpectA.processMsg2(Buffer.alloc(48), devB_Id, devB_PubKey);
  } catch (err) {
    if (err.message.includes('STATIC_IDENTITY_MISMATCH')) caughtStaticMismatch = true;
  }
  assert(caughtStaticMismatch === true, 'Unexpected peer static public key REJECTED (STATIC_IDENTITY_MISMATCH)');

  // -------------------------------------------------------------------------
  // NOISE-08: Wrong Static Identity Protection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] NOISE-08: Wrong Static Identity Command Processing Denial...');
  assert(clientDevExpectA.isHandshakeComplete === false, 'Handshake terminated; no application commands can be processed');

  // -------------------------------------------------------------------------
  // NOISE-09: Identity / Device-ID Binding Check
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] NOISE-09: Identity / Device-ID Binding (Device ID A with PubKey B)...');
  const clientBindingTest = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  clientBindingTest.createHandshakeMsg1();
  let caughtBindingMismatch = false;
  try {
    // Mismatch: Device ID = A, but presented PubKey = B
    clientBindingTest.processMsg2(Buffer.alloc(48), devA_Id, devB_PubKey);
  } catch (err) {
    if (err.message.includes('STATIC_IDENTITY_MISMATCH')) caughtBindingMismatch = true;
  }
  assert(caughtBindingMismatch === true, 'Device ID A presented with PubKey B REJECTED');

  // -------------------------------------------------------------------------
  // NOISE-10: Key Confirmation Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] NOISE-10: Symmetric Key Confirmation...');
  const clientK1 = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  clientK1.createHandshakeMsg1();
  clientK1.processMsg2(Buffer.alloc(48), devA_Id, devA_PubKey);
  clientK1.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));

  const validFrame = clientK1.simulateResponderEncryptedFrame(Buffer.from('CONFIRMATION_TEST', 'utf8'));
  const thirdPartyFakeKey = Buffer.alloc(32, 0x99);
  let caughtThirdPartyError = false;
  try {
    // Simulating third party attempting to decrypt with unauthenticated key
    const thirdPartyFrame = clientK1.simulateResponderEncryptedFrame(Buffer.from('CONFIRMATION_TEST', 'utf8'), thirdPartyFakeKey);
    clientK1.decryptInboundFrame(thirdPartyFrame);
  } catch (err) {
    if (err.message.includes('TAMPER_ERROR')) caughtThirdPartyError = true;
  }
  assert(caughtThirdPartyError === true, 'Unauthenticated third party key unable to compute valid frame tag');

  // -------------------------------------------------------------------------
  // NOISE-11: Cross-Session Counter Isolation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 11] NOISE-11: Cross-Session Counter Isolation...');
  const session1 = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  session1.createHandshakeMsg1();
  session1.processMsg2(Buffer.alloc(48), devA_Id, devA_PubKey);
  session1.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));

  const session2 = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  session2.createHandshakeMsg1();
  session2.processMsg2(Buffer.alloc(48), devA_Id, devA_PubKey);
  session2.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));

  const frameSession1 = session1.simulateResponderEncryptedFrame(Buffer.from('SESSION_1_DATA', 'utf8'));
  let caughtCrossSessionError = false;
  try {
    // Injecting Session 1 ciphertext into Session 2
    session2.decryptInboundFrame(frameSession1);
  } catch (err) {
    if (err.message.includes('TAMPER_ERROR')) caughtCrossSessionError = true;
  }
  assert(caughtCrossSessionError === true, 'Cross-session ciphertext injection REJECTED (Distinct Session Key Material)');

  // -------------------------------------------------------------------------
  // NOISE-12: Maximum Counter / Rekey Boundary Behavior
  // -------------------------------------------------------------------------
  console.log('\n[TEST 12] NOISE-12: Maximum Counter / Rekey Boundary Enforcement...');
  const rekeyClient = new NoiseLanClient(pskHex, devA_Id, devA_PubKey);
  rekeyClient.createHandshakeMsg1();
  rekeyClient.processMsg2(Buffer.alloc(48), devA_Id, devA_PubKey);
  rekeyClient.createHandshakeMsg3(Buffer.from(pskHex, 'hex'));

  // Force nonce to rekey threshold
  rekeyClient.txNonce = 0xFFFFFFFFFF0000n;
  let caughtRekeyError = false;
  try {
    rekeyClient.encryptOutboundFrame(Buffer.from('REKEY_BOUNDARY_FRAME', 'utf8'));
  } catch (err) {
    if (err.message.includes('REKEY_REQUIRED')) caughtRekeyError = true;
  }
  assert(caughtRekeyError === true, 'Monotonic nonce boundary reached; session terminated for rekey');
  assert(rekeyClient.isHandshakeComplete === false, 'Session status set to uninitialized post-rekey trigger');

  console.log('\n===================================================================');
  console.log('  [PASS] ALL NOISE-01 THROUGH NOISE-12 ACCEPTANCE TESTS PASSED!    ');
  console.log('===================================================================');
}

if (require.main === module) {
  runNoiseLanTestSuite();
}
