import React from 'react';
import { User, Bell } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">N</div>
        <div className="brand-text">
          <h1>
            NOSKYTECH
            <span className="pulse-dot"></span>
          </h1>
          <p>Smart Living Ecosystem</p>
        </div>
      </div>

      <div className="header-actions">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" aria-label="Profile">
          <User size={18} />
        </button>
      </div>
    </header>
  );
};
