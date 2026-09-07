import React, { useState } from 'react';
import { Sparkles, Clock, ShieldCheck, Play, Power } from 'lucide-react';
import { AutomationRule } from '../types/automation';

export const AutomationsScreen: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Morning Routine',
      scheduleOrTrigger: 'Every day · 06:30',
      enabled: true,
      actions: ['Living Room Lights ON', 'Curtains OPEN', 'Climate HVAC ON'],
      localExecution: true,
    },
    {
      id: 'rule-2',
      name: 'Away Mode',
      scheduleOrTrigger: 'When everyone leaves (Radar Absent)',
      enabled: true,
      actions: ['All Relay Outputs OFF', 'Smart Sockets OFF', 'Security Mode ON'],
      localExecution: true,
    },
    {
      id: 'rule-3',
      name: 'Night Mode',
      scheduleOrTrigger: 'Every day · 22:30',
      enabled: false,
      actions: ['Indoor Lights OFF', 'Outdoor Floodlight ON', 'Climate 20°C'],
      localExecution: true,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="greeting-section">
        <span className="greeting-time">LOCAL AUTOMATION ENGINE</span>
        <h1 className="greeting-title">Automations</h1>
      </div>

      {/* Architecture Notice Banner */}
      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={20} style={{ color: '#10b981' }} />
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          <strong style={{ color: '#ffffff' }}>Offline Execution Guaranteed:</strong> All rules execute locally on the ESP32-S3 RTC without needing Internet connection.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {rules.map((rule) => (
          <div key={rule.id} className="energy-summary-card">
            <div className="section-header">
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{rule.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Clock size={12} />
                  <span>{rule.scheduleOrTrigger}</span>
                </div>
              </div>

              <div 
                onClick={() => toggleRule(rule.id)}
                className={`control-pill ${rule.enabled ? 'active' : ''}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px' }}
              >
                {rule.enabled ? '● ACTIVE' : '○ DISABLED'}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {rule.actions.map((act, i) => (
                <span key={i} style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                  {act}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span className="card-meta" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} />
                Local ESP32 Rule
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
