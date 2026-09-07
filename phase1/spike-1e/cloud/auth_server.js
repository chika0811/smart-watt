/**
 * Phase 1E EMQX MQTT 5.0 Enhanced Authentication (SASL) Server & Topic Authorization Engine.
 * 
 * Cryptographic Protocol: NOSKY-RSA3072-PSS
 * Transcript Envelope:
 *   NOSKY-MQTT5-AUTH-v1:<device_id>:<home_id>:<session_id>:<challenge_nonce>:<timestamp>:<broker_domain>
 */

const crypto = require('crypto');
const dbVault = require('./db_vault');
const redisCache = require('./redis_cache');

class AuthServer {
  constructor(brokerDomain = 'mqtt.noskytech.com') {
    this.brokerDomain = brokerDomain;
    this.activeSessions = new Map(); // sessionId -> challenge Object
  }

  // Build the authoritative signed transcript string
  static buildAuthTranscript(deviceId, homeId, sessionId, challengeNonce, timestamp, brokerDomain) {
    return `NOSKY-MQTT5-AUTH-v1:${deviceId}:${homeId}:${sessionId}:${challengeNonce}:${timestamp}:${brokerDomain}`;
  }

  // STEP 1 & 2: Process Initial AUTH Packet -> Generate SASL Challenge
  handleInitialAuth(deviceId, homeId) {
    // 1. Verify device exists and authorized in target home
    const authz = redisCache.getDeviceAuthz(deviceId, homeId);
    if (!authz.authorized) {
      return {
        success: false,
        reason: authz.reason,
        mqttReasonCode: 0x80 // Unspecified auth error
      };
    }

    // 2. Generate cryptographically random challenge & session metadata
    const sessionId = `sess-${crypto.randomBytes(8).toString('hex')}`;
    const challengeNonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);

    // Track session challenge in Redis to enforce single-use and expiration (30s)
    const tracked = redisCache.trackSessionChallenge(sessionId, challengeNonce, 30);
    if (!tracked) {
      return { success: false, reason: 'DUPLICATE_SESSION_ID', mqttReasonCode: 0x80 };
    }

    const sessionData = {
      sessionId,
      deviceId,
      homeId,
      challengeNonce,
      timestamp,
      brokerDomain: this.brokerDomain,
      expiresAt: Date.now() + 30000 // 30 second validity
    };

    this.activeSessions.set(sessionId, sessionData);

    return {
      success: true,
      mqttReasonCode: 0x18, // Continue Authentication (SASL Challenge)
      authMethod: 'NOSKY-RSA3072-PSS',
      sessionId,
      challengeNonce,
      timestamp,
      brokerDomain: this.brokerDomain
    };
  }

  // STEP 3 & 4: Process AUTH Challenge Response -> Verify RSA-3072 PSS Signature
  handleChallengeResponse(sessionId, signatureHex, customTimestamp = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, reason: 'INVALID_OR_EXPIRED_SESSION', mqttReasonCode: 0x80 };
    }

    // 1. Check expiration (30 seconds)
    const now = customTimestamp ? customTimestamp : Date.now();
    if (now > session.expiresAt) {
      this.activeSessions.delete(sessionId);
      redisCache.consumeSessionChallenge(sessionId);
      return { success: false, reason: 'CHALLENGE_EXPIRED', mqttReasonCode: 0x80 };
    }

    // 2. Consume challenge nonce from Redis (single-use / anti-replay)
    const cachedNonce = redisCache.consumeSessionChallenge(sessionId);
    if (!cachedNonce || cachedNonce !== session.challengeNonce) {
      this.activeSessions.delete(sessionId);
      return { success: false, reason: 'CHALLENGE_REPLAYED_OR_CONSUMED', mqttReasonCode: 0x80 };
    }

    // 3. Re-verify device status & authorization (in case revoked mid-handshake)
    const authz = redisCache.getDeviceAuthz(session.deviceId, session.homeId);
    if (!authz.authorized) {
      this.activeSessions.delete(sessionId);
      return { success: false, reason: authz.reason, mqttReasonCode: 0x80 };
    }

    // 4. Retrieve RSA-3072 Public Key (from Redis cache or Postgres)
    const rsaPubKeyPem = redisCache.getDevicePublicKey(session.deviceId);
    if (!rsaPubKeyPem) {
      this.activeSessions.delete(sessionId);
      return { success: false, reason: 'PUBLIC_KEY_NOT_FOUND', mqttReasonCode: 0x80 };
    }

    // 5. Re-construct exact expected transcript
    const transcriptStr = AuthServer.buildAuthTranscript(
      session.deviceId,
      session.homeId,
      session.sessionId,
      session.challengeNonce,
      session.timestamp,
      session.brokerDomain
    );

    // 6. Cryptographically verify RSA-3072 PSS signature
    const verifier = crypto.createVerify('sha256');
    verifier.update(transcriptStr, 'utf8');

    let isSigValid = false;
    try {
      const sigBuf = Buffer.from(signatureHex, 'hex');
      isSigValid = verifier.verify(
        {
          key: rsaPubKeyPem,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 32
        },
        sigBuf
      );
    } catch (err) {
      isSigValid = false;
    }

    this.activeSessions.delete(sessionId);

    if (!isSigValid) {
      return { success: false, reason: 'INVALID_RSA_PSS_SIGNATURE', mqttReasonCode: 0x80 };
    }

    // 7. Authentication Success -> Provision MQTT Topic Authorization Matrix
    const aclScope = {
      deviceId: session.deviceId,
      homeId: session.homeId,
      allowedTopics: {
        telemetryPub: `nosky/${session.homeId}/devices/${session.deviceId}/telemetry`,
        commandsSub: `nosky/${session.homeId}/devices/${session.deviceId}/commands`,
        statePubSub: `nosky/${session.homeId}/devices/${session.deviceId}/state`
      }
    };

    return {
      success: true,
      mqttReasonCode: 0x00, // Success (CONNACK Authorized)
      sessionId: session.sessionId,
      deviceId: session.deviceId,
      homeId: session.homeId,
      aclScope
    };
  }

  // Topic ACL Authorization Verification
  verifyTopicPermission(authenticatedDevId, authenticatedHomeId, topicString, actionType /* 'PUB' or 'SUB' */) {
    // Check revocation / reassignment status on every publish/subscribe frame
    const authz = redisCache.getDeviceAuthz(authenticatedDevId, authenticatedHomeId);
    if (!authz.authorized) {
      return { allowed: false, reason: authz.reason };
    }

    const expectedTelemetry = `nosky/${authenticatedHomeId}/devices/${authenticatedDevId}/telemetry`;
    const expectedCommands = `nosky/${authenticatedHomeId}/devices/${authenticatedDevId}/commands`;
    const expectedState = `nosky/${authenticatedHomeId}/devices/${authenticatedDevId}/state`;

    if (actionType === 'PUB') {
      if (topicString === expectedTelemetry || topicString === expectedState) {
        return { allowed: true };
      }
    } else if (actionType === 'SUB') {
      if (topicString === expectedCommands || topicString === expectedState) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: 'TOPIC_ACL_DENIED: Device attempt to access outside permitted home/device namespace'
    };
  }

  reset() {
    this.activeSessions.clear();
  }
}

module.exports = AuthServer;
