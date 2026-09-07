import React from 'react';
import { AppHeader } from '../components/AppHeader';
import { EnvironmentHero } from '../components/EnvironmentHero';
import { EnergyOverview } from '../components/EnergyOverview';
import { QuickControls } from '../components/QuickControls';
import { EnergySummary } from '../components/EnergySummary';
import { mockEnergy } from '../mock/data';

export const HomeScreen: React.FC = () => {
  return (
    <div className="app-container">
      {/* Header */}
      <AppHeader />

      {/* Greeting Banner */}
      <div className="greeting-section">
        <span className="greeting-time">Good afternoon</span>
        <h1 className="greeting-title">Your home</h1>
      </div>

      {/* Environment Image Hero */}
      <EnvironmentHero onlineDevicesCount={6} />

      {/* Power Overview (1.84 kW, 238.6 V, 7.8 A) */}
      <EnergyOverview metrics={mockEnergy} />

      {/* Quick Controls (Lighting, Climate) */}
      <QuickControls />

      {/* Energy Summary (7.42 kWh today) */}
      <EnergySummary energyToday={mockEnergy.energyToday} />
    </div>
  );
};
