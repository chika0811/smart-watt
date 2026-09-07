export interface AutomationRule {
  id: string;
  name: string;
  scheduleOrTrigger: string;
  enabled: boolean;
  actions: string[];
  localExecution: boolean;
}
