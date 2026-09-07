import React from 'react';
import { Wifi, Sparkles } from 'lucide-react';

interface EnvironmentHeroProps {
  onlineDevicesCount?: number;
}

export const EnvironmentHero: React.FC<EnvironmentHeroProps> = ({ onlineDevicesCount = 6 }) => {
  return (
    <div className="hero-card">
      <img src="/modern_living_space_hero.png" alt="Living Space" className="hero-img" />
      <div className="hero-overlay"></div>

      <div className="hero-badge">
        <Wifi size={14} />
        <span>{onlineDevicesCount} devices online</span>
      </div>

      <div className="hero-content">
        <div className="hero-subtitle">
          <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Primary Environment
        </div>
        <h2 className="hero-title">LIVING SPACE</h2>
        <p className="hero-desc">Comfortable &bull; Optimal Ambient Lighting &bull; 22°C</p>
      </div>
    </div>
  );
};
