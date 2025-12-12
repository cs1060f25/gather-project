import React, { useState, useEffect } from 'react';
import './DayNightToggle.css';

interface DayNightToggleProps {
  onChange?: (isDark: boolean) => void;
}

export const DayNightToggle: React.FC<DayNightToggleProps> = ({ onChange }) => {
  const [isNight, setIsNight] = useState(() => {
    // Check localStorage first, then fall back to current class
    const saved = localStorage.getItem('gatherly_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return document.documentElement.classList.contains('dark-mode');
  });

  useEffect(() => {
    // Apply dark mode class and save to localStorage
    if (isNight) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('gatherly_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('gatherly_dark_mode', 'false');
    }
    onChange?.(isNight);
  }, [isNight, onChange]);

  const handleToggle = () => {
    setIsNight(!isNight);
  };

  return (
    <div 
      className={`day-night-toggle ${isNight ? 'night' : ''}`}
      onClick={handleToggle}
      role="button"
      aria-label={isNight ? 'Switch to light mode' : 'Switch to dark mode'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
    >
      <div className={`toggle-container ${isNight ? 'toggle-container--night' : ''}`}>
        {/* Stars */}
        <div className={`stars ${isNight ? 'stars--night' : ''}`}>
          <div className="star star--1"></div>
          <div className="star star--2"></div>
          <div className="star star--3"></div>
          <div className="star star--1b"></div>
          <div className="star star--2b"></div>
          <div className="star star--3b"></div>
          <div className="star-round star-round--1"></div>
          <div className="star-round star-round--2"></div>
          <div className="star-round star-round--3"></div>
          <div className="star-round star-round--4"></div>
          <div className="star-round star-round--5"></div>
          <div className="star-round star-round--6"></div>
        </div>
        
        {/* Clouds */}
        <div className={`cloud cloud--2 ${isNight ? 'cloud--night' : ''}`}></div>
        <div className={`cloud cloud--1 ${isNight ? 'cloud--night' : ''}`}></div>
        
        {/* Radiants */}
        <div className={`radiant sun-radiant ${isNight ? 'sun-radiant--night' : ''}`}></div>
        <div className={`radiant moon-radiant ${isNight ? 'moon-radiant--night' : ''}`}></div>
        
        {/* Toggle Dot (Sun/Moon) */}
        <div className={`toggle-dot ${isNight ? 'toggle-dot--night' : ''}`}>
          <div className={`toggle-crater toggle-crater--1 ${isNight ? 'toggle-crater--night' : ''}`}></div>
          <div className={`toggle-crater toggle-crater--2 ${isNight ? 'toggle-crater--night' : ''}`}></div>
          <div className={`toggle-crater toggle-crater--3 ${isNight ? 'toggle-crater--night' : ''}`}></div>
        </div>
      </div>
    </div>
  );
};
