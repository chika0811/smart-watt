import React, { useState } from 'react';
import { deviceApi } from '../api/deviceApi';
import { TransportType } from '../api/transport';
import { SlidersHorizontal, Cpu, Wifi, Key, Server, Check } from 'lucide-react';

export const MoreScreen: React.FC = () => {
  const [activeTransport, setActiveTransport] = useState<TransportType>(deviceApi.getTransportType());
  const [targetIp, setTargetIp] = useState<string>('192.168.4.1');

  const handleTransportChange = (type: TransportType) => {
    deviceApi.setTransport(type, targetIp);
    setActiveTransport(type);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="greeting-section">
        <span className="greeting-time">SYSTEM SETTINGS</span>
        <h1 className="greeting-title">More & Settings</h1>
      </div>

      {/* Transport Abstraction Selector */}
      <div className="energy-summary-card">
        <div className="section-header">
          <span className="section-label">
            <Server size={14} style={{ color: '#10b981' }} />
            COMMUNICATION TRANSPORT LAYER
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* MOCK TRANSPORT */}
          <div 
            onClick={() => handleTransportChange('mock')}
            className={`control-card ${activeTransport === 'mock' ? 'active' : ''}`}
            style={{ height: 'auto', padding: '14px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Mock Reactive Transport</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>In-memory state engine & telemetry ticker</div>
            </div>
            {activeTransport === 'mock' && <Check size={18} style={{ color: '#10b981' }} />}
          </div>

          {/* LOCAL ESP32 TRANSPORT */}
          <div 
            onClick={() => handleTransportChange('local')}
            className={`control-card ${activeTransport === 'local' ? 'active' : ''}`}
            style={{ height: 'auto', padding: '14px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Local ESP32 Direct Wi-Fi</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>HTTP REST / WebSocket at http://{targetIp}</div>
            </div>
            {activeTransport === 'local' && <Check size={18} style={{ color: '#10b981' }} />}
          </div>

          {/* CLOUD GATEWAY TRANSPORT */}
          <div 
            onClick={() => handleTransportChange('cloud')}
            className={`control-card ${activeTransport === 'cloud' ? 'active' : ''}`}
            style={{ height: 'auto', padding: '14px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>NoSkyTech Cloud Gateway</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Supabase / Deno Edge HTTPS Gateway</div>
            </div>
            {activeTransport === 'cloud' && <Check size={18} style={{ color: '#10b981' }} />}
          </div>
        </div>
      </div>

      {/* SECURITY IDENTITY CARD */}
      <div className="energy-summary-card">
        <div className="section-header">
          <span className="section-label">
            <Key size={14} style={{ color: '#3b82f6' }} />
            SECURITY & HARDWARE IDENTITY
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
            <span>Identity Core</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>ESP32-S3 Hardware DS Peripheral</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
            <span>Device Key</span>
            <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>RSA-3072 PSS (eFuse Bound)</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
            <span>LAN Transport</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>Noise Protocol Suite</span>
          </div>
        </div>
      </div>
    </div>
  );
};
