export interface RelayState {
  channel: number;    // 1 to 8
  name: string;       // Custom channel label
  enabled: boolean;   // Active-High driver state
  gpio: number;       // Hardware GPIO pin allocation
}
