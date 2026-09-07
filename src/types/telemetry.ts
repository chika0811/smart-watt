export interface SmartWattTelemetry {
  voltage: number;         // V RMS
  current: number;         // A RMS
  activePower: number;     // kW
  apparentPower: number;   // kVA
  powerFactor: number;     // 0.0 - 1.0
  energyWh: number;        // Wh accumulated
  timestamp: number;       // ms epoch
}
