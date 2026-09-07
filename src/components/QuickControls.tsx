import React, { useState } from 'react';
import { Lightbulb, Thermometer, Sliders } from 'lucide-react';

export const QuickControls: React.FC = () => {
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [climateOn, setClimateOn] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="section-header">
        <span className="section-label">CONTROLS</span>
      </div>

      <div className="controls-grid">
        {/* LIGHTING CARD */}
        <div
          onClick={() => setLightsOn(!lightsOn)}
          className={`control-card ${lightsOn ? 'active' : ''}`}
        >
          <div className="control-top">
            <div className="control-icon">
              <Lightbulb size={18} />
            </div>
            <span className="control-pill">{lightsOn ? 'ON' : 'OFF'}</span>
          </div>
          <div>
            <div className="control-title">LIGHTING</div>
            <div className="control-sub">Architectural Downlights</div>
          </div>
        </div>

        {/* CLIMATE CARD */}
        <div
          onClick={() => setClimateOn(!climateOn)}
          className={`control-card ${climateOn ? 'active' : ''}`}
        >
          <div className="control-top">
            <div className="control-icon">
              <Thermometer size={18} />
            </div>
            <span className="control-pill">{climateOn ? 'ON' : 'OFF'}</span>
          </div>
          <div>
            <div className="control-title">CLIMATE</div>
            <div className="control-sub">HVAC 22°C System</div>
          </div>
        </div>
      </div>
    </div>
  );
};
