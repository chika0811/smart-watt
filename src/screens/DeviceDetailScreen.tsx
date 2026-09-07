import React, { useEffect, useState } from 'react';
import { deviceApi } from '../api/deviceApi';
import { SmartWattState } from '../types/device';
import { ArrowLeft, Zap, Power, ShieldCheck, Activity } from 'lucide-react';

interface DeviceDetailScreenProps {
  onBack: () => void;
}

export const DeviceDetailScreen: React.FC<DeviceDetailScreenProps> = ({ onBack }) => {
  const [state, setState] = useState<SmartWattState | null>(null);

  useEffect(() => {
    const unsubscribe = deviceApi.subscribeState('smart-watt-v1-001', (newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleRelay = async (channel: number, currentStatus: boolean) => {
    await deviceApi.setRelayState('smart-watt-v1-001', channel, !currentStatus);
  };

  if (!state) return null;

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={onBack}
          className="icon-btn" 
          aria-label="Back"
          style={{ width: '36px', height: '36px' }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <span className="hero-subtitle">LIVING ROOM</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Smart Watt V1</h2>
        </div>

        <div className="hero-badge" style={{ position: 'relative', top: 0, right: 0, padding: '4px 10px', fontSize: '11px' }}>
          <span className="pulse-dot"></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* Main Power Hero Card */}
      <div className="energy-summary-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(16, 185, 129, 0.08))', textAlign: 'center', padding: '24px' }}>
        <span className="section-label" style={{ justifyContent: 'center' }}>
          <Zap size={14} style={{ color: '#10b981' }} />
          CURRENT POWER
        </span>
        <div style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff', margin: '8px 0' }}>
          {state.telemetry.activePower.toFixed(2)}
          <span style={{ fontSize: '18px', fontFamily: 'var(--font-sans)', color: '#10b981', marginLeft: '6px' }}>kW</span>
        </div>

        <div className="power-grid" style={{ marginTop: '12px' }}>
          <div className="power-card" style={{ padding: '10px' }}>
            <span className="card-tag">Voltage</span>
            <div className="card-value" style={{ fontSize: '18px' }}>
              {state.telemetry.voltage.toFixed(1)}
              <span className="card-unit" style={{ fontSize: '12px', color: '#94a3b8' }}>V</span>
            </div>
          </div>

          <div className="power-card" style={{ padding: '10px' }}>
            <span className="card-tag">Current</span>
            <div className="card-value" style={{ fontSize: '18px' }}>
              {state.telemetry.current.toFixed(1)}
              <span className="card-unit" style={{ fontSize: '12px', color: '#94a3b8' }}>A</span>
            </div>
          </div>

          <div className="power-card" style={{ padding: '10px' }}>
            <span className="card-tag">Power Factor</span>
            <div className="card-value" style={{ fontSize: '18px' }}>
              {state.telemetry.powerFactor.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* POWER OUTPUTS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="section-header">
          <span className="section-label">POWER OUTPUTS (8 CHANNELS)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {state.relays.map((relay) => (
            <div
              key={relay.channel}
              onClick={() => handleToggleRelay(relay.channel, relay.enabled)}
              className={`control-card ${relay.enabled ? 'active' : ''}`}
              style={{ height: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span className="card-meta" style={{ fontSize: '14px', fontWeight: 800, color: relay.enabled ? '#10b981' : '#64748b', width: '24px' }}>
                  {relay.channel < 10 ? `0${relay.channel}` : relay.channel}
                </span>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{relay.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>GPIO {relay.gpio}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`control-pill ${relay.enabled ? 'active' : ''}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                  {relay.enabled ? '● ON' : '○ OFF'}
                </span>
                
                <button
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: relay.enabled ? '#10b981' : 'rgba(30, 41, 59, 0.8)',
                    color: relay.enabled ? '#030712' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TODAY'S ENERGY ACCUMULATION */}
      <div className="energy-summary-card">
        <div className="section-header">
          <span className="section-label">TODAY</span>
        </div>
        <div className="energy-main">
          <div className="energy-val">
            {(state.telemetry.energyWh / 1000).toFixed(2)}
            <span>kWh</span>
          </div>
          <span className="card-meta">Energy Consumed</span>
        </div>
      </div>

    </div>
  );
};
