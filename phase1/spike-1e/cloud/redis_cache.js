/**
 * Phase 1E Redis Caching & Invalidation Layer.
 * 
 * Cache Keys & TTL Structure:
 * - dev:pubkey:<device_id> -> RSA-3072 Public Key PEM string (TTL: 300s)
 * - dev:authz:<device_id>  -> JSON string { home_id, status } (TTL: 300s)
 * - auth:session:<session_id> -> Challenge transcript tracking to prevent replay (TTL: 60s)
 * 
 * Features:
 * - Immediate cache invalidation on device revocation / home reassignment
 * - Resilient fallback to PostgreSQL (DbVault) if Redis is unavailable
 */

const dbVault = require('./db_vault');

class RedisCache {
  constructor() {
    this.cache = new Map(); // key -> { val, expiresAt }
    this.fallbackSessionMap = new Map(); // Fallback session tracker when Redis is down
    this.isAvailable = true; // Toggle to simulate Redis failure
  }

  setAvailable(status) {
    this.isAvailable = status;
  }

  // Key getters & setters with TTL
  get(key) {
    if (!this.isAvailable) return null; // Fallback to DB
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.val;
  }

  set(key, val, ttlSeconds = 300) {
    if (!this.isAvailable) return;
    this.cache.set(key, {
      val,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  del(key) {
    if (!this.isAvailable) return;
    this.cache.delete(key);
  }

  // High-level Helper: Get RSA Public Key (Cache -> DB Fallback)
  getDevicePublicKey(deviceId) {
    const cacheKey = `dev:pubkey:${deviceId}`;
    let pubKey = this.get(cacheKey);

    if (!pubKey) {
      // Cache miss or Redis unavailable -> query DB
      const dev = dbVault.getDevice(deviceId);
      if (dev && dev.rsa_public_key_pem) {
        pubKey = dev.rsa_public_key_pem;
        if (this.isAvailable) {
          this.set(cacheKey, pubKey, 300); // 300s TTL
        }
      }
    }
    return pubKey;
  }

  // High-level Helper: Get Device Authorization Scope (Cache -> DB Fallback)
  getDeviceAuthz(deviceId, targetHomeId) {
    const cacheKey = `dev:authz:${deviceId}`;
    let authzJson = this.get(cacheKey);
    let authz;

    if (authzJson) {
      authz = JSON.parse(authzJson);
    } else {
      // Cache miss or Redis unavailable -> query DB
      const result = dbVault.verifyDeviceAuthorization(deviceId, targetHomeId);
      if (result.authorized) {
        authz = {
          home_id: result.home_id,
          status: 'claimed',
          revoked: false
        };
        if (this.isAvailable) {
          this.set(cacheKey, JSON.stringify(authz), 300); // 300s TTL
        }
      } else {
        return result; // Authorized = false with reason
      }
    }

    // Re-verify against home target
    if (authz.revoked || authz.status !== 'claimed') {
      return { authorized: false, reason: 'DEVICE_REVOKED_OR_DISABLED' };
    }
    if (authz.home_id !== targetHomeId) {
      return { authorized: false, reason: 'CROSS_HOME_UNAUTHORIZED' };
    }

    return {
      authorized: true,
      device_id: deviceId,
      home_id: authz.home_id
    };
  }

  // Cache Invalidation Engine (Called when device is revoked or reassigned in Postgres)
  purgeDeviceCache(deviceId) {
    this.del(`dev:pubkey:${deviceId}`);
    this.del(`dev:authz:${deviceId}`);
  }

  // Track session nonces to enforce single-use / anti-replay
  trackSessionChallenge(sessionId, challengeNonce, ttlSeconds = 60) {
    const key = `auth:session:${sessionId}`;
    if (!this.isAvailable) {
      if (this.fallbackSessionMap.has(key)) return false;
      this.fallbackSessionMap.set(key, challengeNonce);
      return true;
    }

    if (this.get(key)) {
      return false; // Already used or active!
    }
    this.set(key, challengeNonce, ttlSeconds);
    return true;
  }

  consumeSessionChallenge(sessionId) {
    const key = `auth:session:${sessionId}`;
    if (!this.isAvailable) {
      const nonce = this.fallbackSessionMap.get(key);
      if (!nonce) return null;
      this.fallbackSessionMap.delete(key);
      return nonce;
    }

    const nonce = this.get(key);
    if (!nonce) return null;
    this.del(key); // Single-use consumption
    return nonce;
  }

  clear() {
    this.cache.clear();
    this.fallbackSessionMap.clear();
    this.isAvailable = true;
  }
}

module.exports = new RedisCache();
