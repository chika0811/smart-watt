import { SmartWattState } from '../types/device';

export type TransportType = 'mock' | 'local' | 'cloud';

export interface IDeviceTransport {
  type: TransportType;
  getSmartWattState(deviceId: string): Promise<SmartWattState>;
  setRelayState(deviceId: string, channel: number, enabled: boolean): Promise<SmartWattState>;
  subscribeState(deviceId: string, callback: (state: SmartWattState) => void): () => void;
}
