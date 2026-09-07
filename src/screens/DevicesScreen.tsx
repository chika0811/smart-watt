import React, { useEffect, useState } from 'react';
import { deviceApi } from '../api/deviceApi';
import { SmartWattState } from '../types/device';
import { Cpu, Zap, Sliders, CheckCircle2, ChevronRight } from 'lucide-react';

interface DevicesScreenProps {
  onSelectSmartWatt: () => void;
}

export const DevicesScreen: React.FC<DevicesScreenProps> = ({ onSelectSmartWatt }) => {
  const [smartWattState, setSmartWattState] = useState<SmartWattState | null>(null);

  useEffect(() => {
    const unsubscribe = deviceApi.subscribeState('smart-watt-v1-001', (state) => {
      setSmartWattState(state);
    });
    return () => unsubscribe();
  }, []);

  const activeRelaysCount = smartWattState ? smartWattState.relays.filter(r => r.enabled).length : 0;

  return (
    <div className="app-container">
      {/* Greeting Header */}
      <div className="greeting-section">
        <span className="greeting-time">DEVICES ECOSYSTEM</span>
        <h1 className="greeting-title">Good evening, Chika</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* SMART WATT V1 MAIN DEVICE CARD */}
        <div 
          onClick={onSelectSmartWatt}
          className="energy-summary-card" 
          style={{ cursor: 'pointer', position: 'relative', border: '1px solid rgba(16, 185, 129, 0.25)' }}
        >
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="brand-icon" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                <Zap size={16} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Smart Watt</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Living Room &bull; SW-8CH-ESP32-V1</div>
              </div>
            </div>

            <div className="energy-badge">
              <span className="pulse-dot"></span>
              <span>ONLINE</span>
            </div>
          </div>

          {smartWattState && (
            <div className="power-grid">
              <div className="power-card" style={{ padding: '12px' }}>
                <span className="card-tag">Voltage</span>
                <div className="card-value" style={{ fontSize: '18px' }}>
                  {smartWattState.telemetry.voltage.toFixed(1)}
                  <span className="card-unit" style={{ fontSize: '11px', color: '#94a3b8' }}>V</span>
                </div>
              </div>

              <div className="power-card highlight" style={{ padding: '12px' }}>
                <span className="card-tag">Active Power</span>
                <div className="card-value" style={{ fontSize: '18px' }}>
                  {smartWattState.telemetry.activePower.toFixed(2)}
                  <span className="card-unit" style={{ fontSize: '11px' }}>kW</span>
                </div>
              </div>

              <div className="power-card" style={{ padding: '12px' }}>
                <span className="card-tag">Current / PF</span>
                <div className="card-value" style={{ fontSize: '18px' }}>
                  {smartWattState.telemetry.current.toFixed(1)}
                  <span className="card-unit" style={{ fontSize: '11px', color: '#94a3b8' }}>A</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', pt: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <Sliders size={14} style={{ color: '#10b981' }} />
              <span>{activeRelaysCount} of 8 channels active</span>
            </div>

            <button 
              className="energy-badge" 
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <span>8 OUTPUTS</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* SMART PLUG CARD */}
        <div className="energy-summary-card" style={{ opacity: 0.9 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="brand-icon" style={{ width: '32px', height: '32px', background: '#3b82f6', color: '#fff', fontSize: '12px' }}>
                <Cpu size={16} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Smart Plug</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Bedroom &bull; SP-1CH-V1</div>
              </div>
            </div>

            <div className="energy-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <span className="pulse-dot" style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></span>
              <span>ONLINE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
