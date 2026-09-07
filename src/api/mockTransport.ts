import { IDeviceTransport, TransportType } from './transport';
import { SmartWattState } from '../types/device';

export class MockTransport implements IDeviceTransport {
  type: TransportType = 'mock';

  private state: SmartWattState = {
    deviceId: 'smart-watt-v1-001',
    name: 'Smart Watt',
    room: 'Living Room',
    model: 'SW-8CH-ESP32-V1',
    online: true,
    capabilities: {
      relay: true,
      totalCurrent: true,
      energy: true,
      presence: true,
    },
    telemetry: {
      voltage: 238.6,
      current: 7.8,
      activePower: 1.84,
      apparentPower: 1.96,
      powerFactor: 0.94,
      energyWh: 7420,
      timestamp: Date.now(),
    },
    relays: [
      { channel: 1, name: 'Living Room Lights', enabled: true, gpio: 4 },
      { channel: 2, name: 'Ceiling Fan', enabled: false, gpio: 5 },
      { channel: 3, name: 'TV & Media Center', enabled: true, gpio: 6 },
      { channel: 4, name: 'Smart Socket', enabled: false, gpio: 7 },
      { channel: 5, name: 'Climate AC System', enabled: true, gpio: 15 },
      { channel: 6, name: 'Kitchen Downlights', enabled: false, gpio: 16 },
      { channel: 7, name: 'Bedroom Lights', enabled: false, gpio: 17 },
      { channel: 8, name: 'Outdoor Floodlight', enabled: false, gpio: 18 },
    ],
  };

  private listeners: Map<string, Set<(state: SmartWattState) => void>> = new Map();

  constructor() {
    // Subtle telemetry variation ticker (0.5Hz)
    setInterval(() => {
      this.tickTelemetry();
    }, 2000);
  }

  private tickTelemetry() {
    const activeRelaysCount = this.state.relays.filter(r => r.enabled).length;
    // Calculate total load based on active relays
    const baseCurrent = activeRelaysCount * 2.2 + 1.2;
    const currentVar = (Math.random() * 0.1 - 0.05);
    const voltageVar = (Math.random() * 0.4 - 0.2);

    const voltage = parseFloat((238.6 + voltageVar).toFixed(1));
    const current = parseFloat(Math.max(0, baseCurrent + currentVar).toFixed(1));
    const powerFactor = 0.94;
    const apparentPower = parseFloat(((voltage * current) / 1000).toFixed(2));
    const activePower = parseFloat((apparentPower * powerFactor).toFixed(2));

    this.state = {
      ...this.state,
      telemetry: {
        ...this.state.telemetry,
        voltage,
        current,
        activePower,
        apparentPower,
        timestamp: Date.now(),
      },
    };

    this.notifySubscribers();
  }

  async getSmartWattState(deviceId: string): Promise<SmartWattState> {
    return { ...this.state };
  }

  async setRelayState(deviceId: string, channel: number, enabled: boolean): Promise<SmartWattState> {
    this.state = {
      ...this.state,
      relays: this.state.relays.map(r =>
        r.channel === channel ? { ...r, enabled } : r
      ),
    };

    // Recalculate power immediately
    this.tickTelemetry();
    this.notifySubscribers();
    return { ...this.state };
  }

  subscribeState(deviceId: string, callback: (state: SmartWattState) => void): () => void {
    if (!this.listeners.has(deviceId)) {
      this.listeners.set(deviceId, new Set());
    }
    const set = this.listeners.get(deviceId)!;
    set.add(callback);

    // Initial callback
    callback({ ...this.state });

    return () => {
      set.delete(callback);
    };
  }

  private notifySubscribers() {
    const set = this.listeners.get(this.state.deviceId);
    if (set) {
      const copy = { ...this.state };
      set.forEach(cb => cb(copy));
    }
  }
}
