import React from 'react';
import { TrendingDown } from 'lucide-react';

interface EnergySummaryProps {
  energyToday: number;
}

export const EnergySummary: React.FC<EnergySummaryProps> = ({ energyToday }) => {
  const targetBudget = 12.0;
  const percentage = Math.min(100, Math.round((energyToday / targetBudget) * 100));

  return (
    <div className="energy-summary-card">
      <div className="section-header">
        <span className="section-label">ENERGY</span>
      </div>

      <div className="energy-main">
        <div className="energy-val">
          {energyToday.toFixed(2)}
          <span>kWh today</span>
        </div>

        <div className="energy-badge">
          <TrendingDown size={14} />
          <span>-12% vs yesterday</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>

        <div className="progress-labels">
          <span>0 kWh</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{percentage}% of 12.0 kWh budget</span>
          <span>12 kWh</span>
        </div>
      </div>
    </div>
  );
};
