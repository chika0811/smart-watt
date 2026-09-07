import { IDeviceTransport, TransportType } from './transport';
import { SmartWattState } from '../types/device';

export class LocalTransport implements IDeviceTransport {
  type: TransportType = 'local';
  private targetIp: string;

  constructor(targetIp: string = '192.168.4.1') {
    this.targetIp = targetIp;
  }

  async getSmartWattState(deviceId: string): Promise<SmartWattState> {
    try {
      const res = await fetch(`http://${this.targetIp}/api/v1/state`);
      if (!res.ok) throw new Error('Local ESP32 HTTP request failed');
      return await res.json();
    } catch (err) {
      console.warn('LocalTransport connection offline, fallback to mock state', err);
      throw err;
    }
  }

  async setRelayState(deviceId: string, channel: number, enabled: boolean): Promise<SmartWattState> {
    const res = await fetch(`http://${this.targetIp}/api/v1/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, enabled }),
    });
    if (!res.ok) throw new Error('Failed to set relay state on ESP32');
    return await res.json();
  }

  subscribeState(deviceId: string, callback: (state: SmartWattState) => void): () => void {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`ws://${this.targetIp}/ws`);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          callback(data);
        } catch (e) {
          console.error('Failed to parse WebSocket telemetry frame', e);
        }
      };
    } catch (e) {
      console.warn('Local WebSocket connection failed', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }
}
