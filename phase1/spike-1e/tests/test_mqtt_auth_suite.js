/**
 * Phase 1E Automated MQTT 5.0 Enhanced Authentication Test Suite
 * Includes Acceptance Tests MQTT-01 through MQTT-20
 */

const dbVault = require('../cloud/db_vault');
const redisCache = require('../cloud/redis_cache');
const AuthServer = require('../cloud/auth_server');
const RsaSigner = require('../device/rsa_signer');
const Mqtt5Device = require('../device/mqtt5_device');

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`TEST FAILURE: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runMqttAuthTestSuite() {
  console.log('===================================================================');
  console.log(' NOSKYTECH PHASE 1E — EMQX MQTT 5.0 ENHANCED AUTH TEST SUITE       ');
  console.log('===================================================================');

  // Environment Setup
  dbVault.reset();
  redisCache.clear();
  const authServer = new AuthServer('mqtt.noskytech.com');

  // Register Device 1 (Legitimate)
  const dev1Id = '55555555-5555-5555-5555-111111111111';
  const home1Id = 'home-1111';
  const signer1 = new RsaSigner(dev1Id);
  dbVault.registerDevice(dev1Id, 'NOSKY-SW01-2026-000001', signer1.getPublicKeyPem(), home1Id, 'claimed');

  // Register Device 2 (Another Home)
  const dev2Id = '55555555-5555-5555-5555-222222222222';
  const home2Id = 'home-2222';
  const signer2 = new RsaSigner(dev2Id);
  dbVault.registerDevice(dev2Id, 'NOSKY-SW01-2026-000002', signer2.getPublicKeyPem(), home2Id, 'claimed');

  // -------------------------------------------------------------------------
  // MQTT-01: Broker Startup & Baseline Connectivity Simulation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] MQTT-01: EMQX MQTT 5 Broker Baseline Service Verification...');
  assert(authServer !== null && authServer.brokerDomain === 'mqtt.noskytech.com', 'EMQX Broker authentication service active');

  // -------------------------------------------------------------------------
  // MQTT-02 & MQTT-03: SASL Enhanced Auth Handshake & Challenge Generation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] MQTT-02 & MQTT-03: SASL Enhanced Auth Handshake & Challenge Nonce Generation...');
  const initAuthRes = authServer.handleInitialAuth(dev1Id, home1Id);
  assert(initAuthRes.success === true, 'Initial AUTH packet processed successfully');
  assert(initAuthRes.mqttReasonCode === 0x18, 'MQTT 5.0 Reason Code 0x18 (Continue Authentication / Challenge) returned');
  assert(initAuthRes.authMethod === 'NOSKY-RSA3072-PSS', 'Authentication mechanism NOSKY-RSA3072-PSS asserted');
  assert(initAuthRes.challengeNonce.length === 64, '256-bit (64 hex char) random challenge nonce generated');

  // -------------------------------------------------------------------------
  // MQTT-04 & MQTT-05 & MQTT-06: RSA-3072 PSS Signing, Verification, & Valid Authentication
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] MQTT-04, MQTT-05 & MQTT-06: ESP32-S3 RSA-3072 PSS Signing & Valid Auth Completion...');
  const device1 = new Mqtt5Device(dev1Id, home1Id, signer1);
  const authSuccessRes = device1.authenticate(authServer);
  assert(authSuccessRes.success === true, 'Valid device authenticated successfully');
  assert(authSuccessRes.mqttReasonCode === 0x00, 'MQTT 5.0 Reason Code 0x00 (Success / CONNACK Authorized) returned');
  assert(device1.isAuthenticated === true, 'Device status updated to Authenticated');

  // -------------------------------------------------------------------------
  // MQTT-07: Unknown Device Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] MQTT-07: Unknown Device Rejection...');
  const unknownDevId = '99999999-9999-9999-9999-999999999999';
  const unknownSigner = new RsaSigner(unknownDevId);
  const unknownDevice = new Mqtt5Device(unknownDevId, home1Id, unknownSigner);
  const unknownRes = unknownDevice.authenticate(authServer);
  assert(unknownRes.success === false, 'Unknown device connection rejected');
  assert(unknownRes.reason === 'DEVICE_NOT_FOUND', 'Rejection reason marked DEVICE_NOT_FOUND');

  // -------------------------------------------------------------------------
  // MQTT-08: Mismatched Key Binding Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] MQTT-08: Mismatched Key Binding Rejection...');
  // Device 1 ID signed with Device 2's key
  const devMismatched = new Mqtt5Device(dev1Id, home1Id, signer2);
  const mismatchRes = devMismatched.authenticate(authServer);
  assert(mismatchRes.success === false, 'Mismatched public key signature rejected');
  assert(mismatchRes.reason === 'INVALID_RSA_PSS_SIGNATURE', 'Rejection reason marked INVALID_RSA_PSS_SIGNATURE');

  // -------------------------------------------------------------------------
  // MQTT-09: Invalid Signature Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] MQTT-09: Invalid / Tampered Signature Rejection...');
  const chalRes = authServer.handleInitialAuth(dev1Id, home1Id);
  const tamperedSig = 'a'.repeat(768); // 384 bytes / 768 hex chars of corrupted signature data
  const tamperedRes = authServer.handleChallengeResponse(chalRes.sessionId, tamperedSig);
  assert(tamperedRes.success === false, 'Corrupted RSA signature rejected');
  assert(tamperedRes.reason === 'INVALID_RSA_PSS_SIGNATURE', 'Rejection reason marked INVALID_RSA_PSS_SIGNATURE');

  // -------------------------------------------------------------------------
  // MQTT-10: Replay Attack Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] MQTT-10: Challenge Replay Rejection...');
  const chalResReplay = authServer.handleInitialAuth(dev1Id, home1Id);
  const transcriptReplay = AuthServer.buildAuthTranscript(
    dev1Id, home1Id, chalResReplay.sessionId, chalResReplay.challengeNonce, chalResReplay.timestamp, chalResReplay.brokerDomain
  );
  const validSig = signer1.signTranscript(transcriptReplay);

  // First submit succeeds
  const firstUse = authServer.handleChallengeResponse(chalResReplay.sessionId, validSig);
  assert(firstUse.success === true, 'First challenge response submission accepted');

  // Second submit (Replay) fails
  const replayUse = authServer.handleChallengeResponse(chalResReplay.sessionId, validSig);
  assert(replayUse.success === false, 'Replayed challenge response submission rejected');
  assert(replayUse.reason.includes('REPLAYED_OR_CONSUMED') || replayUse.reason.includes('INVALID_OR_EXPIRED'), 'Replay protection enforced');

  // -------------------------------------------------------------------------
  // MQTT-11: Expired Challenge Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] MQTT-11: Expired Authentication Challenge Rejection...');
  const deviceExpired = new Mqtt5Device(dev1Id, home1Id, signer1);
  const expiredTime = Date.now() + 45000; // 45 seconds later (> 30s TTL)
  const expiredRes = deviceExpired.authenticate(authServer, expiredTime);
  assert(expiredRes.success === false, 'Authentication attempt with expired challenge (>30s) rejected');
  assert(expiredRes.reason === 'CHALLENGE_EXPIRED', 'Rejection reason marked CHALLENGE_EXPIRED');

  // -------------------------------------------------------------------------
  // MQTT-12: Cross-Home Authentication Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] MQTT-12: Cross-Home Authentication Rejection...');
  // Device 1 (owned by home-1111) attempts to authenticate into home-2222
  const crossHomeDev = new Mqtt5Device(dev1Id, home2Id, signer1);
  const crossHomeRes = crossHomeDev.authenticate(authServer);
  assert(crossHomeRes.success === false, 'Device 1 attempting auth into Home 2 rejected');
  assert(crossHomeRes.reason === 'CROSS_HOME_UNAUTHORIZED', 'Rejection reason marked CROSS_HOME_UNAUTHORIZED');

  // -------------------------------------------------------------------------
  // MQTT-13: Revoked Device Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] MQTT-13: Revoked Device Rejection & Cache Invalidation...');
  // Revoke Device 1 in Postgres DB Vault & purge Redis Cache
  dbVault.setDeviceStatus(dev1Id, 'revoked');
  redisCache.purgeDeviceCache(dev1Id);

  const revokedDev = new Mqtt5Device(dev1Id, home1Id, signer1);
  const revokedRes = revokedDev.authenticate(authServer);
  assert(revokedRes.success === false, 'Revoked device authentication rejected');
  assert(revokedRes.reason === 'DEVICE_REVOKED', 'Rejection reason marked DEVICE_REVOKED');

  // Restore Device 1 status for subsequent tests
  dbVault.setDeviceStatus(dev1Id, 'claimed');
  redisCache.purgeDeviceCache(dev1Id);

  // -------------------------------------------------------------------------
  // MQTT-14: Disabled Device Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 11] MQTT-14: Disabled Device Rejection...');
  dbVault.setDeviceStatus(dev1Id, 'disabled');
  redisCache.purgeDeviceCache(dev1Id);

  const disabledDev = new Mqtt5Device(dev1Id, home1Id, signer1);
  const disabledRes = disabledDev.authenticate(authServer);
  assert(disabledRes.success === false, 'Disabled device authentication rejected');
  assert(disabledRes.reason === 'DEVICE_DISABLED', 'Rejection reason marked DEVICE_DISABLED');

  // Restore Device 1 status
  dbVault.setDeviceStatus(dev1Id, 'claimed');
  redisCache.purgeDeviceCache(dev1Id);

  // -------------------------------------------------------------------------
  // MQTT-15: Duplicate / Concurrent Session Handling
  // -------------------------------------------------------------------------
  console.log('\n[TEST 12] MQTT-15: Duplicate / Concurrent Session Handling...');
  const devConn = new Mqtt5Device(dev1Id, home1Id, signer1);
  const conn1 = devConn.authenticate(authServer);
  assert(conn1.success === true, 'First connection authenticated');

  // Second concurrent authentication attempt creates new distinct session
  const conn2 = devConn.authenticate(authServer);
  assert(conn2.success === true, 'Second concurrent authentication handled safely with unique session ID');
  assert(conn1.sessionId !== conn2.sessionId, 'Session IDs are distinct and non-conflicting');

  // -------------------------------------------------------------------------
  // MQTT-16: Topic Authorization Scope Provisioning
  // -------------------------------------------------------------------------
  console.log('\n[TEST 13] MQTT-16: Authorization Scope Provisioning...');
  assert(conn2.aclScope.allowedTopics.telemetryPub === `nosky/${home1Id}/devices/${dev1Id}/telemetry`, 'Telemetry publication topic scoped to home/device');
  assert(conn2.aclScope.allowedTopics.commandsSub === `nosky/${home1Id}/devices/${dev1Id}/commands`, 'Commands subscription topic scoped to home/device');
  assert(conn2.aclScope.allowedTopics.statePubSub === `nosky/${home1Id}/devices/${dev1Id}/state`, 'State topic scoped to home/device');

  // -------------------------------------------------------------------------
  // MQTT-17: Cross-Home Topic Subscription Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 14] MQTT-17: Cross-Home Topic Subscription Rejection...');
  let caughtCrossSub = false;
  try {
    devConn.subscribeTopic(authServer, `nosky/${home2Id}/devices/${dev2Id}/commands`);
  } catch (err) {
    if (err.message.includes('TOPIC_ACL_DENIED')) caughtCrossSub = true;
  }
  assert(caughtCrossSub === true, 'Subscription to another home/device topic DENIED');

  // -------------------------------------------------------------------------
  // MQTT-18: Cross-Home Telemetry Publication Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 15] MQTT-18: Cross-Home Telemetry Publication Rejection...');
  let caughtCrossPub = false;
  try {
    devConn.publishTelemetry(authServer, `nosky/${home2Id}/devices/${dev1Id}/telemetry`, { voltage: 230 });
  } catch (err) {
    if (err.message.includes('TOPIC_ACL_DENIED')) caughtCrossPub = true;
  }
  assert(caughtCrossPub === true, 'Publication into another home namespace DENIED');

  // -------------------------------------------------------------------------
  // MQTT-19: Device Impersonation Rejection
  // -------------------------------------------------------------------------
  console.log('\n[TEST 16] MQTT-19: Device Impersonation Rejection...');
  let caughtImpersonation = false;
  try {
    devConn.publishTelemetry(authServer, `nosky/${home1Id}/devices/${dev2Id}/telemetry`, { voltage: 230 });
  } catch (err) {
    if (err.message.includes('TOPIC_ACL_DENIED')) caughtImpersonation = true;
  }
  assert(caughtImpersonation === true, 'Publication under another device_id namespace DENIED');

  // Valid publication to own topic succeeds
  const pubValid = devConn.publishTelemetry(authServer, `nosky/${home1Id}/devices/${dev1Id}/telemetry`, { voltage: 230.4 });
  assert(pubValid.published === true, 'Publication to own authorized topic succeeded');

  // -------------------------------------------------------------------------
  // MQTT-20: Broker Restart & Authentication Bypass Prevention
  // -------------------------------------------------------------------------
  console.log('\n[TEST 17] MQTT-20: Broker Restart & Authentication Bypass Prevention...');
  authServer.reset();
  const postRestartDev = new Mqtt5Device(dev1Id, home1Id, signer1);
  let caughtUnauthPub = false;
  try {
    postRestartDev.publishTelemetry(authServer, `nosky/${home1Id}/devices/${dev1Id}/telemetry`, { voltage: 230 });
  } catch (err) {
    if (err.message.includes('Unauthenticated client')) caughtUnauthPub = true;
  }
  assert(caughtUnauthPub === true, 'Broker reset clears session state; unauthenticated publish rejected');

  // Re-authentication required post-restart
  const reauthRes = postRestartDev.authenticate(authServer);
  assert(reauthRes.success === true, 'Re-authentication post-restart succeeds via full SASL flow');

  // -------------------------------------------------------------------------
  // Redis Failure & Fallback Resilience
  // -------------------------------------------------------------------------
  console.log('\n[TEST 18] Redis Outage & PostgreSQL Direct Fallback Resilience...');
  redisCache.setAvailable(false); // Simulate Redis cache outage
  const redisOutageDev = new Mqtt5Device(dev1Id, home1Id, signer1);
  const fallbackAuthRes = redisOutageDev.authenticate(authServer);
  assert(fallbackAuthRes.success === true, 'Authentication succeeds via direct PostgreSQL DB vault fallback during Redis outage');
  redisCache.setAvailable(true); // Restore Redis

  console.log('\n===================================================================');
  console.log('  [PASS] ALL MQTT-01 THROUGH MQTT-20 ACCEPTANCE TESTS PASSED!       ');
  console.log('===================================================================');
}

if (require.main === module) {
  runMqttAuthTestSuite();
}
