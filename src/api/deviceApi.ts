import { IDeviceTransport, TransportType } from './transport';
import { MockTransport } from './mockTransport';
import { LocalTransport } from './localTransport';
import { CloudTransport } from './cloudTransport';
import { SmartWattState } from '../types/device';

class DeviceApi {
  private activeTransport: IDeviceTransport;

  constructor() {
    this.activeTransport = new MockTransport();
  }

  setTransport(type: TransportType, ipOrUrl?: string) {
    if (type === 'local') {
      this.activeTransport = new LocalTransport(ipOrUrl || '192.168.4.1');
    } else if (type === 'cloud') {
      this.activeTransport = new CloudTransport(ipOrUrl);
    } else {
      this.activeTransport = new MockTransport();
    }
  }

  getTransportType(): TransportType {
    return this.activeTransport.type;
  }

  async getSmartWattState(deviceId: string = 'smart-watt-v1-001'): Promise<SmartWattState> {
    return await this.activeTransport.getSmartWattState(deviceId);
  }

  async setRelayState(deviceId: string, channel: number, enabled: boolean): Promise<SmartWattState> {
    return await this.activeTransport.setRelayState(deviceId, channel, enabled);
  }

  subscribeState(deviceId: string, callback: (state: SmartWattState) => void): () => void {
    return this.activeTransport.subscribeState(deviceId, callback);
  }
}

export const deviceApi = new DeviceApi();
