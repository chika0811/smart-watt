import React, { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { DevicesScreen } from './screens/DevicesScreen';
import { DeviceDetailScreen } from './screens/DeviceDetailScreen';
import { AutomationsScreen } from './screens/AutomationsScreen';
import { MoreScreen } from './screens/MoreScreen';
import { BottomNavigation } from './components/BottomNavigation';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const handleSelectSmartWatt = () => {
    setSelectedDevice('smart-watt-v1-001');
  };

  const handleBackToDevices = () => {
    setSelectedDevice(null);
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100 font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(255,255,255,0))]"></div>

      {/* Screen Router */}
      {selectedDevice === 'smart-watt-v1-001' ? (
        <DeviceDetailScreen onBack={handleBackToDevices} />
      ) : (
        <>
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'devices' && <DevicesScreen onSelectSmartWatt={handleSelectSmartWatt} />}
          {activeTab === 'automations' && <AutomationsScreen />}
          {activeTab === 'more' && <MoreScreen />}

          {/* Fixed Bottom Navigation */}
          <BottomNavigation 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setSelectedDevice(null);
              setActiveTab(tab);
            }} 
          />
        </>
      )}
    </div>
  );
}
