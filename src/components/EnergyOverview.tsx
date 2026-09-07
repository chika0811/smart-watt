import React from 'react';
import { EnergyMetrics } from '../types/device';
import { Zap, Activity, Gauge } from 'lucide-react';

interface EnergyOverviewProps {
  metrics: EnergyMetrics;
}

export const EnergyOverview: React.FC<EnergyOverviewProps> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="section-header">
        <span className="section-label">
          <Zap size={14} style={{ color: '#10b981' }} />
          POWER
        </span>
        <span className="card-meta">PF {metrics.powerFactor.toFixed(2)}</span>
      </div>

      <div className="power-grid">
        {/* Active Power */}
        <div className="power-card highlight">
          <span className="card-tag">Current usage</span>
          <div className="card-value">
            {metrics.activePower.toFixed(2)}
            <span className="card-unit">kW</span>
          </div>
          <span className="card-meta">{metrics.apparentPower.toFixed(2)} kVA</span>
        </div>

        {/* Grid Voltage */}
        <div className="power-card">
          <span className="card-tag">Grid voltage</span>
          <div className="card-value">
            {metrics.voltage.toFixed(1)}
            <span className="card-unit" style={{ color: '#94a3b8' }}>V</span>
          </div>
          <span className="card-meta">240V Nominal</span>
        </div>

        {/* Total Current */}
        <div className="power-card">
          <span className="card-tag">Total current</span>
          <div className="card-value">
            {metrics.current.toFixed(1)}
            <span className="card-unit" style={{ color: '#94a3b8' }}>A</span>
          </div>
          <span className="card-meta">Single CT</span>
        </div>
      </div>
    </div>
  );
};
