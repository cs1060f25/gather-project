import React from 'react';

export const CalendarView: React.FC = () => {
    // Mock time slots for a day
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>Today</h2>
                <span className="date-display">November 29</span>
            </div>

            <div className="calendar-grid">
                {hours.map((hour) => (
                    <div key={hour} className="time-slot">
                        <div className="time-label">
                            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                        </div>
                        <div className="slot-content">
                            {/* Mock events */}
                            {hour === 10 && (
                                <div className="event-card glass-panel" style={{ height: '90%', top: '5%' }}>
                                    <div className="event-title">Team Standup</div>
                                    <div className="event-time">10:00 - 11:00 AM</div>
                                </div>
                            )}
                            {hour === 14 && (
                                <div className="event-card glass-panel" style={{ height: '180%', top: '5%', background: 'rgba(45, 212, 191, 0.15)', borderColor: 'var(--accent-primary)' }}>
                                    <div className="event-title">Deep Work</div>
                                    <div className="event-time">2:00 - 4:00 PM</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
