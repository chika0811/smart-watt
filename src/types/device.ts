import { SmartWattTelemetry } from './telemetry';
import { RelayState } from './relay';

export interface DeviceCapabilities {
  relay: boolean;
  totalCurrent: boolean;
  energy: boolean;
  presence: boolean;
  // NOTE: perOutputCurrent is deliberately excluded for Hardware Revision SW-8CH-ESP32-V1.
}

export interface SmartWattState {
  deviceId: string;
  name: string;
  room: string;
  model: string;
  online: boolean;
  telemetry: SmartWattTelemetry;
  relays: RelayState[];
  capabilities: DeviceCapabilities;
}

export interface GenericDevice {
  id: string;
  name: string;
  room: string;
  type: 'smart_watt' | 'plug' | 'switch' | 'sensor';
  online: boolean;
  summary?: string;
}
