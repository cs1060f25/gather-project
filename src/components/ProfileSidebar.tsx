import React, { useState, useEffect } from 'react';
import './ProfileSidebar.css';
import { DayNightToggle } from './DayNightToggle';


interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  icon: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
}

interface ProfileSidebarProps {
  isOpen: boolean;
  user: UserProfile | null;
  contacts: Contact[];
  onClose: () => void;
  onSignOut: () => void;
  onAddContact: (contact: Contact) => void;
  onRemoveContact?: (contactId: string) => void;
  onImportContacts?: () => void;
  isCalendarConnected?: boolean;
  onConnectCalendar?: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  isOpen,
  user, 
  contacts: propContacts,
  onClose, 
  onSignOut,
  onAddContact,
  onRemoveContact,
  isCalendarConnected = false,
  onConnectCalendar
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'people' | 'settings'>('profile');
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [recentPeople, setRecentPeople] = useState<{email: string; name?: string}[]>([]);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Use real contacts only - no mock data
  const contacts = propContacts;
  
  // Load recent people from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gatherly_recent_people');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentPeople(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Error loading recent people:', e);
    }
  }, [isOpen]); // Reload when sidebar opens

  // Auto-detect timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(tz);
    localStorage.setItem('gatherly_timezone', tz);
    localStorage.setItem('gatherly_detected_timezone', tz);
  }, []);

  // Load weather based on IP
  useEffect(() => {
    const loadWeather = async () => {
      if (!isOpen) return;
      
      setWeatherLoading(true);
      try {
        // First get location from IP
        const locResponse = await fetch('https://ipapi.co/json/');
        if (!locResponse.ok) throw new Error('Failed to get location');
        const locData = await locResponse.json();
        
        // Then get weather from Open-Meteo (free, no API key needed)
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
        );
        if (!weatherResponse.ok) throw new Error('Failed to get weather');
        const weatherData = await weatherResponse.json();
        
        // Map weather code to condition and icon
        const code = weatherData.current.weather_code;
        let condition = 'Clear';
        let icon = 'sun';
        
        if (code === 0) { condition = 'Clear'; icon = 'sun'; }
        else if (code <= 3) { condition = 'Partly Cloudy'; icon = 'cloud-sun'; }
        else if (code <= 48) { condition = 'Foggy'; icon = 'cloud'; }
        else if (code <= 57) { condition = 'Drizzle'; icon = 'cloud-rain'; }
        else if (code <= 67) { condition = 'Rain'; icon = 'cloud-rain'; }
        else if (code <= 77) { condition = 'Snow'; icon = 'snowflake'; }
        else if (code <= 82) { condition = 'Showers'; icon = 'cloud-rain'; }
        else if (code <= 86) { condition = 'Snow Showers'; icon = 'snowflake'; }
        else { condition = 'Thunderstorm'; icon = 'cloud-lightning'; }
        
        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          condition,
          location: `${locData.city}, ${locData.region}`,
          icon
        });
      } catch (err) {
        console.log('Could not load weather:', err);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
    }
    };
    
    loadWeather();
  }, [isOpen]);


  const clearRecentPeople = () => {
    localStorage.removeItem('gatherly_recent_people');
    setRecentPeople([]);
  };
  
  const handleRemoveContact = (contactId: string) => {
    if (onRemoveContact) {
      onRemoveContact(contactId);
    }
    setConfirmDelete(null);
  };

  if (!isOpen) return null;

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) return;

    onAddContact({
      id: crypto.randomUUID(),
      name: newContact.name,
      email: newContact.email,
      isGatherly: false,
    });
    setNewContact({ name: '', email: '' });
    setShowAddContact(false);
  };

  return (
    <>
      <div className="sidebar-backdrop" onClick={onClose} />
      <aside className="profile-sidebar">
        <div className="sidebar-header">
          <h2>Account</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'people' ? 'active' : ''}`}
            onClick={() => setActiveTab('people')}
          >
            People
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="sidebar-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="profile-info">
                  <h3>{user?.full_name || 'User'}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>

              {/* Weather Widget */}
              <div className="weather-widget">
                {weatherLoading ? (
                  <div className="weather-loading">Loading weather...</div>
                ) : weather ? (
                  <>
                    <div className="weather-icon">
                      {weather.icon === 'sun' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                          <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      )}
                      {weather.icon === 'cloud-sun' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                          <path d="M22 10a5 5 0 0 0-5-5" stroke="#f59e0b"/>
                        </svg>
                      )}
                      {weather.icon === 'cloud' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                        </svg>
                      )}
                      {weather.icon === 'cloud-rain' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                          <path d="M16 14v6M8 14v6M12 16v6"/>
                        </svg>
                      )}
                      {weather.icon === 'snowflake' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                          <line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>
                          <path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>
                        </svg>
                      )}
                      {weather.icon === 'cloud-lightning' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                          <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/>
                          <path d="m13 12-3 5h4l-3 5"/>
                        </svg>
                      )}
                </div>
                    <div className="weather-info">
                      <span className="weather-temp">{weather.temp}°F</span>
                      <span className="weather-condition">{weather.condition}</span>
                      <span className="weather-location">{weather.location}</span>
                </div>
                  </>
                ) : (
                  <div className="weather-unavailable">Weather unavailable</div>
                )}
              </div>

              <div className="calendar-connection">
                <h4>Connected Calendars</h4>
                <div className="connection-item">
                  <span className="connection-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
                  <span className="connection-name">Google Calendar</span>
                  {isCalendarConnected ? (
                    <span className="connection-status connected">Connected</span>
                  ) : (
                    <button 
                      className="connection-status not-connected"
                      onClick={onConnectCalendar}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (
            <div className="people-section">
              {/* Recent People Section */}
              {recentPeople.length > 0 && (
                <div className="recent-people-section">
                  <div className="people-header">
                    <h4>Recently Scheduled</h4>
                    <button 
                      className="btn-small btn-clear"
                      onClick={clearRecentPeople}
                      title="Clear recent"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="recent-list">
                    {recentPeople.map((person, idx) => (
                      <div key={`recent-${idx}`} className="contact-item recent-item">
                        <div className="contact-avatar recent-avatar">
                          {(person.name || person.email)[0].toUpperCase()}
                        </div>
                        <div className="contact-info">
                          <span className="contact-name">{person.name || person.email.split('@')[0]}</span>
                          <span className="contact-email">{person.email}</span>
                        </div>
                        <span className="recent-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="people-header">
                <h4>Your Contacts ({contacts.length})</h4>
                <div className="people-actions">
                <button 
                  className="btn-small"
                  onClick={() => setShowAddContact(!showAddContact)}
                >
                  {showAddContact ? 'Cancel' : '+ Add'}
                </button>
                </div>
              </div>

              {showAddContact && (
                <form className="add-contact-form" onSubmit={handleAddContact}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn-add-contact">Add Contact</button>
                </form>
              )}

              <div className="contacts-list">
                {contacts.length === 0 ? (
                  <div className="no-contacts">
                    <p>No contacts yet</p>
                    <p className="no-contacts-hint">Add contacts to easily invite them to events</p>
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} className="contact-item">
                      <div className="contact-avatar">
                        {contact.name[0].toUpperCase()}
                      </div>
                      <div className="contact-info">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-email">{contact.email}</span>
                      </div>
                      {contact.isGatherly && (
                        <span className="gatherly-user-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </span>
                      )}
                      {onRemoveContact && (
                        <>
                          {confirmDelete === contact.id ? (
                            <div className="confirm-delete">
                              <button 
                                className="btn-confirm-delete"
                                onClick={() => handleRemoveContact(contact.id)}
                              >
                                Remove
                              </button>
                              <button 
                                className="btn-cancel-delete"
                                onClick={() => setConfirmDelete(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn-remove-contact"
                              onClick={() => setConfirmDelete(contact.id)}
                              title="Remove contact"
                            >
                              ×
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="settings-group">
                <h4>Appearance</h4>
                <div className="setting-item appearance-setting">
                  <span>Theme</span>
                  <DayNightToggle />
                </div>
              </div>

              <div className="settings-group">
                <h4>Time Zone</h4>
                <div className="timezone-display">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                  <span className="timezone-value">
                    {detectedTimezone ? detectedTimezone.replace(/_/g, ' ') : 'Detecting...'}
                  </span>
                  <span className="timezone-label">Auto-detected</span>
                </div>
              </div>

              {/* Local Weather */}
              <div className="settings-group">
                <h4>Local Weather</h4>
                <div className="settings-weather-card">
                  {weatherLoading ? (
                    <div className="weather-loading-small">Loading...</div>
                  ) : weather ? (
                    <div className="settings-weather-content">
                      <div className="settings-weather-icon">
                        {weather.icon === 'sun' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                          </svg>
                        )}
                        {weather.icon === 'cloud-sun' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                          </svg>
                        )}
                        {weather.icon === 'cloud' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                          </svg>
                        )}
                        {weather.icon === 'cloud-rain' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                            <path d="M16 14v6M8 14v6M12 16v6"/>
                          </svg>
                        )}
                        {weather.icon === 'snowflake' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                            <line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>
                          </svg>
                        )}
                        {weather.icon === 'cloud-lightning' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/>
                            <path d="m13 12-3 5h4l-3 5"/>
                          </svg>
                        )}
                      </div>
                      <div className="settings-weather-details">
                        <span className="settings-weather-temp">{weather.temp}°F · {weather.condition}</span>
                        <span className="settings-weather-loc">{weather.location}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="weather-unavailable-small">Weather unavailable</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sign-out-btn" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

