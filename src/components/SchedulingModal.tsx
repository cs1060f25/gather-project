import React from 'react';
import './SchedulingModal.css';

interface SchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialInput?: string;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = React.useState(0);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="mac-window">
                {/* Mac OS Title Bar */}
                <div className="mac-titlebar">
                    <div className="mac-traffic-lights">
                        <button className="mac-button mac-close" onClick={onClose} aria-label="Close" />
                        <button className="mac-button mac-minimize" aria-label="Minimize" />
                        <button className="mac-button mac-maximize" aria-label="Maximize" />
                    </div>
                    <div className="mac-title">Schedule Configuration</div>
                    <button className="login-button" onClick={() => alert('Login coming soon!')}>
                        Login
                    </button>
                </div>

                {/* Modal Content */}
                <div className="mac-content">
                    {currentStep === 0 && (
                        <div className="scheduling-step">
                            <h2 className="step-title">Operational hours</h2>
                            <p className="step-description">
                                Choose the hours and days of the week you would like the service to be
                                active in. You can choose a default strategy or customise one yourself.
                            </p>

                            {/* Strategy Selection */}
                            <div className="strategy-section">
                                <h3 className="section-label">Strategy</h3>
                                <div className="strategy-options">
                                    <label className="strategy-card selected">
                                        <input type="radio" name="strategy" value="default" defaultChecked />
                                        <div className="strategy-header">
                                            <span className="strategy-name">Default</span>
                                            <span className="strategy-badge">Recommended</span>
                                        </div>
                                        <p className="strategy-desc">
                                            Best suited for set and forget operators who want to maximise across all times
                                        </p>
                                    </label>

                                    <label className="strategy-card">
                                        <input type="radio" name="strategy" value="custom" />
                                        <div className="strategy-header">
                                            <span className="strategy-name">Custom</span>
                                        </div>
                                        <p className="strategy-desc">
                                            Use for specific control and optimise for each unique window of time
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* Day Selection */}
                            <div className="eligible-times-section">
                                <h3 className="section-label">Eligible times</h3>
                                <p className="section-sublabel">Select the days of the week to be active</p>

                                <div className="day-selector">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                        <button key={day} className="day-button selected">
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hours Configuration */}
                            <div className="hours-section">
                                <h3 className="section-label">Hours</h3>
                                <p className="section-sublabel">Set which hours want to be active</p>

                                <div className="hours-list">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                                        <div key={day} className="hour-row">
                                            <div className="hour-day">{day}</div>
                                            <div className="hour-controls">
                                                <label className="toggle-switch">
                                                    <input type="checkbox" defaultChecked={idx > 0} />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                                <span className="hour-status">{idx > 0 ? 'Active' : 'Inactive'}</span>
                                                {idx > 0 && (
                                                    <select className="time-select">
                                                        <option>Morning - Lunch - Afternoon</option>
                                                        <option>Morning</option>
                                                        <option>Lunch</option>
                                                        <option>Afternoon</option>
                                                        <option>Evening</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                                <button className="btn-primary" onClick={() => setCurrentStep(1)}>Continue</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="scheduling-step">
                            <h2 className="step-title">Date Selection</h2>
                            <p className="step-description">Choose specific dates for scheduling (coming soon)</p>

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setCurrentStep(0)}>Back</button>
                                <button className="btn-primary" onClick={onClose}>Complete</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
