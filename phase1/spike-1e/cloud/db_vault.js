/**
 * Phase 1E PostgreSQL / Supabase Device Ownership & Authorization Vault (Mock Layer).
 * 
 * Manages physical device registration, RSA-3072 public keys, home ownership,
 * device status ('claimed', 'unclaimed', 'disabled', 'revoked'), and tenant ACL bindings.
 */

class DbVault {
  constructor() {
    // Database Tables Simulation
    this.devices = new Map(); // dev_id -> device record
    this.homeMembers = new Map(); // home_id -> Set(user_id)
  }

  // Register a device with hardware identity (RSA-3072 Public Key)
  registerDevice(deviceId, serialNumber, rsaPublicKeyPem, homeId = 'home-1111', status = 'claimed') {
    const record = {
      device_id: deviceId,
      serial_number: serialNumber,
      rsa_public_key_pem: rsaPublicKeyPem,
      home_id: homeId,
      status: status, // 'claimed', 'unclaimed', 'disabled', 'revoked'
      revoked_at: null,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    this.devices.set(deviceId, record);
    return record;
  }

  // Get device by ID
  getDevice(deviceId) {
    const dev = this.devices.get(deviceId);
    return dev ? { ...dev } : null;
  }

  // Update device status (e.g. 'revoked', 'disabled', 'claimed')
  setDeviceStatus(deviceId, status) {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;
    dev.status = status;
    if (status === 'revoked') {
      dev.revoked_at = Date.now();
    }
    dev.updated_at = Date.now();
    return true;
  }

  // Reassign device to a different home
  reassignDeviceHome(deviceId, newHomeId) {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;
    dev.home_id = newHomeId;
    dev.updated_at = Date.now();
    return true;
  }

  // Verify whether device authentication and home binding are valid
  verifyDeviceAuthorization(deviceId, targetHomeId) {
    const dev = this.devices.get(deviceId);
    if (!dev) {
      return { authorized: false, reason: 'DEVICE_NOT_FOUND' };
    }
    if (dev.status === 'revoked') {
      return { authorized: false, reason: 'DEVICE_REVOKED' };
    }
    if (dev.status === 'disabled') {
      return { authorized: false, reason: 'DEVICE_DISABLED' };
    }
    if (dev.status !== 'claimed') {
      return { authorized: false, reason: 'DEVICE_UNCLAIMED' };
    }
    if (dev.home_id !== targetHomeId) {
      return { authorized: false, reason: 'CROSS_HOME_UNAUTHORIZED' };
    }
    return {
      authorized: true,
      device_id: dev.device_id,
      home_id: dev.home_id,
      rsa_public_key_pem: dev.rsa_public_key_pem
    };
  }

  // Clear all mock data
  reset() {
    this.devices.clear();
    this.homeMembers.clear();
  }
}

module.exports = new DbVault();
