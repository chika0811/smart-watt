import { IDeviceTransport, TransportType } from './transport';
import { SmartWattState } from '../types/device';

export class CloudTransport implements IDeviceTransport {
  type: TransportType = 'cloud';
  private gatewayUrl: string;

  constructor(gatewayUrl: string = 'https://wcvipkkcxhjfdgvkrhza.supabase.co/functions/v1/device-gateway') {
    this.gatewayUrl = gatewayUrl;
  }

  async getSmartWattState(deviceId: string): Promise<SmartWattState> {
    const res = await fetch(`${this.gatewayUrl}/state?deviceId=${deviceId}`);
    if (!res.ok) throw new Error('Cloud Gateway request failed');
    return await res.json();
  }

  async setRelayState(deviceId: string, channel: number, enabled: boolean): Promise<SmartWattState> {
    const res = await fetch(`${this.gatewayUrl}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, command: 'SET_RELAY', params: { channel, enabled } }),
    });
    if (!res.ok) throw new Error('Failed to send cloud command');
    return await res.json();
  }

  subscribeState(deviceId: string, callback: (state: SmartWattState) => void): () => void {
    // Cloud SSE / WebSocket subscription placeholder
    const timer = setInterval(async () => {
      try {
        const state = await this.getSmartWattState(deviceId);
        callback(state);
      } catch (e) {
        // Silently retry
      }
    }, 5000);

    return () => clearInterval(timer);
  }
}
