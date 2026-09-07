/**
 * Phase 1E Client-Side MQTT 5.0 Enhanced Authentication SASL Device.
 * 
 * Executes full SASL Enhanced Authentication Flow:
 * 1. Initiates AUTH with AUTH_METHOD = "NOSKY-RSA3072-PSS", device_id, home_id
 * 2. Receives SASL Challenge (challenge_nonce, session_id, timestamp, broker_domain)
 * 3. Reconstructs Transcript & computes RSA-3072 PSS Signature via RsaSigner
 * 4. Submits AUTH Response & processes CONNACK (0x00 Success)
 * 5. Executes authorized MQTT 5.0 Publish & Subscribe frames
 */

const AuthServer = require('../cloud/auth_server');

class Mqtt5Device {
  constructor(deviceId, homeId, rsaSigner) {
    this.deviceId = deviceId;
    this.homeId = homeId;
    this.rsaSigner = rsaSigner;
    this.isAuthenticated = false;
    this.activeSessionId = null;
    this.aclScope = null;
  }

  // Execute MQTT 5.0 SASL Enhanced Authentication Handshake
  authenticate(authServerInstance, customTimestamp = null) {
    // 1. Send Initial AUTH packet
    const challengeRes = authServerInstance.handleInitialAuth(this.deviceId, this.homeId);
    if (!challengeRes.success) {
      this.isAuthenticated = false;
      return { success: false, reason: challengeRes.reason, mqttReasonCode: challengeRes.mqttReasonCode };
    }

    this.activeSessionId = challengeRes.sessionId;

    // 2. Reconstruct Exact Transcript
    const transcriptStr = AuthServer.buildAuthTranscript(
      this.deviceId,
      this.homeId,
      challengeRes.sessionId,
      challengeRes.challengeNonce,
      challengeRes.timestamp,
      challengeRes.brokerDomain
    );

    // 3. Compute RSA-3072 PSS Signature via RsaSigner (inside secure HW boundary)
    const signatureHex = this.rsaSigner.signTranscript(transcriptStr);

    // 4. Send AUTH Response packet back to server
    const authRes = authServerInstance.handleChallengeResponse(
      challengeRes.sessionId,
      signatureHex,
      customTimestamp
    );

    if (!authRes.success) {
      this.isAuthenticated = false;
      this.activeSessionId = null;
      return { success: false, reason: authRes.reason, mqttReasonCode: authRes.mqttReasonCode };
    }

    this.isAuthenticated = true;
    this.aclScope = authRes.aclScope;

    return {
      success: true,
      mqttReasonCode: 0x00,
      sessionId: authRes.sessionId,
      aclScope: authRes.aclScope
    };
  }

  // Publish Telemetry frame to permitted MQTT topic
  publishTelemetry(authServerInstance, topicString, payloadData) {
    if (!this.isAuthenticated) {
      throw new Error('MQTT_ERROR: Unauthenticated client cannot publish');
    }

    const check = authServerInstance.verifyTopicPermission(this.deviceId, this.homeId, topicString, 'PUB');
    if (!check.allowed) {
      throw new Error(`AUTHORIZATION_ERROR: ${check.reason}`);
    }

    return {
      published: true,
      topic: topicString,
      payload: payloadData
    };
  }

  // Subscribe to Permitted Commands / State topic
  subscribeTopic(authServerInstance, topicString) {
    if (!this.isAuthenticated) {
      throw new Error('MQTT_ERROR: Unauthenticated client cannot subscribe');
    }

    const check = authServerInstance.verifyTopicPermission(this.deviceId, this.homeId, topicString, 'SUB');
    if (!check.allowed) {
      throw new Error(`AUTHORIZATION_ERROR: ${check.reason}`);
    }

    return {
      subscribed: true,
      topic: topicString
    };
  }
}

module.exports = Mqtt5Device;
