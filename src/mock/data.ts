import { Device, EnergyMetrics } from '../types/device';

export const mockEnergy: EnergyMetrics = {
  voltage: 238.6,
  current: 7.8,
  activePower: 1.84,
  apparentPower: 1.96,
  powerFactor: 0.94,
  energyToday: 7.42,
};

export const smartWattDevice: Device = {
  id: "smart-watt-001",
  name: "Smart Watt",
  room: "Living Room",
  type: "smart_watt",
  online: true,
  capabilities: {
    relay: true,
    totalCurrent: true,
    energy: true,
    presence: true,
  },
};

export const mockDevices: Device[] = [
  smartWattDevice,
  {
    id: "switch-001",
    name: "Architectural Downlights",
    room: "Living Room",
    type: "switch",
    online: true,
    capabilities: { relay: true, totalCurrent: false, energy: false, presence: false }
  },
  {
    id: "climate-001",
    name: "Climate HVAC Control",
    room: "Living Space",
    type: "switch",
    online: true,
    capabilities: { relay: true, totalCurrent: false, energy: false, presence: false }
  },
  {
    id: "sensor-001",
    name: "LD2410B mmWave Radar",
    room: "Living Room",
    type: "sensor",
    online: true,
    capabilities: { relay: false, totalCurrent: false, energy: false, presence: true }
  }
];
