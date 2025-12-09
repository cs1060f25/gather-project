import React, { useState } from 'react';
import './ProfileSidebar.css';
import { DayNightToggle } from './DayNightToggle';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
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
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  isOpen,
  user, 
  contacts: propContacts,
  onClose, 
  onSignOut,
  onAddContact,
  onRemoveContact,
  onImportContacts
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'people' | 'settings'>('profile');
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Use real contacts only - no mock data
  const contacts = propContacts;
  
  const handleImportContacts = async () => {
    if (!onImportContacts) return;
    setIsImporting(true);
    try {
      await onImportContacts();
    } finally {
      setIsImporting(false);
    }
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

              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-value">12</span>
                  <span className="stat-label">Events</span>
                </div>
                <div className="stat">
                  <span className="stat-value">3</span>
                  <span className="stat-label">Contacts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">2</span>
                  <span className="stat-label">Calendars</span>
                </div>
              </div>

              <div className="calendar-connection">
                <h4>Connected Calendars</h4>
                <div className="connection-item">
                  <span className="connection-icon">📅</span>
                  <span className="connection-name">Google Calendar</span>
                  <span className="connection-status connected">Connected</span>
                </div>
              </div>
            </div>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (
            <div className="people-section">
              <div className="people-header">
                <h4>Your Contacts ({contacts.length})</h4>
                <div className="people-actions">
                <button 
                  className="btn-small"
                  onClick={() => setShowAddContact(!showAddContact)}
                >
                  {showAddContact ? 'Cancel' : '+ Add'}
                </button>
                {onImportContacts && (
                  <button 
                    className="btn-small import-btn"
                      onClick={handleImportContacts}
                      disabled={isImporting}
                      title="Import from Google Contacts"
                  >
                      {isImporting ? 'Importing...' : '📥 Google'}
                  </button>
                )}
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
                        <span className="gatherly-user-badge">📅</span>
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
                <h4>Notifications</h4>
                <label className="setting-item">
                  <span>Email Notifications</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
                <label className="setting-item">
                  <span>Calendar Reminders</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>

              <div className="settings-group">
                <h4>Default View</h4>
                <select className="settings-select">
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="agenda">Agenda</option>
                </select>
              </div>

              <div className="settings-group">
                <h4>Time Zone</h4>
                <select className="settings-select">
                  <option value="auto">Auto-detect</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
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

