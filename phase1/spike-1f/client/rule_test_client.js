/**
 * Phase 1F Cypher Intent Parser & CommandCoordinator Client Simulation.
 * 
 * Demonstrates natural language translation into deterministic typed JSON rules:
 * Input: "Turn on the bulb at 7 AM and turn it off at 12 PM"
 * Output: Two compiled typed automation rules dispatched via CommandCoordinator.
 */

class CypherIntentParser {
  // Translate natural language text into typed automation rules
  static parseSchedulingIntent(promptText, targetEndpoint = 'relay_1') {
    const rules = [];

    if (promptText.includes('7 AM') || promptText.includes('7:00 AM')) {
      rules.push({
        rule_id: 'rule-cypher-0700-on',
        enabled: true,
        name: 'Cypher Schedule 07:00 ON',
        priority: 10,
        trigger: {
          type: 'TIME_TRIGGER',
          cron: '0 7 * * *',
          sensor_instance_id: null
        },
        conditions: [
          { field: 'presence_state', operator: 'EQUALS', value: 'ABSENT' }
        ],
        actions: [
          { type: 'SET_OUTPUT', endpoint_instance_id: targetEndpoint, capability: 'power', desired_value: true }
        ],
        schedule: { timezone: 'Africa/Lagos', dst_active: false },
        execution_policy: { missed_schedule_policy: 'IGNORE', retry_count: 3 }
      });
    }

    if (promptText.includes('12 PM') || promptText.includes('12:00 PM')) {
      rules.push({
        rule_id: 'rule-cypher-1200-off',
        enabled: true,
        name: 'Cypher Schedule 12:00 OFF',
        priority: 10,
        trigger: {
          type: 'TIME_TRIGGER',
          cron: '0 12 * * *',
          sensor_instance_id: null
        },
        conditions: [],
        actions: [
          { type: 'SET_OUTPUT', endpoint_instance_id: targetEndpoint, capability: 'power', desired_value: false }
        ],
        schedule: { timezone: 'Africa/Lagos', dst_active: false },
        execution_policy: { missed_schedule_policy: 'IGNORE', retry_count: 3 }
      });
    }

    return rules;
  }
}

module.exports = CypherIntentParser;
