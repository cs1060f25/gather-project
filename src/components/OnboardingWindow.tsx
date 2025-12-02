import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Button } from './Button';

interface OnboardingWindowProps {
    onClose: () => void;
}

export const OnboardingWindow: React.FC<OnboardingWindowProps> = ({ onClose }) => {
    const [step, setStep] = useState(1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="onboarding-step">
                        <h3>Welcome to Gatherly</h3>
                        <p>Let's get your scheduling agent set up. First, what are your top 3 goals right now?</p>
                        <textarea className="mac-input" placeholder="e.g., Get a summer internship, Reconnect with old friends..." rows={4} />
                        <div className="step-actions">
                            <Button variant="secondary" size="sm" onClick={onClose}>Skip</Button>
                            <Button variant="primary" size="sm" onClick={() => setStep(2)}>Next</Button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="onboarding-step">
                        <h3>Relationships</h3>
                        <p>Who are the people you want to see more of?</p>
                        <div className="input-group">
                            <label>Close Friends</label>
                            <input type="text" className="mac-input" placeholder="Names..." />
                        </div>
                        <div className="input-group">
                            <label>Professional Circle</label>
                            <input type="text" className="mac-input" placeholder="Communities..." />
                        </div>
                        <div className="step-actions">
                            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Back</Button>
                            <Button variant="primary" size="sm" onClick={onClose}>Finish</Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Draggable handle=".mac-title-bar">
            <div className="mac-window">
                <div className="mac-title-bar">
                    <div className="mac-buttons">
                        <div className="mac-btn close" onClick={onClose}></div>
                        <div className="mac-btn minimize"></div>
                        <div className="mac-btn maximize"></div>
                    </div>
                    <div className="mac-title">Setup Assistant</div>
                </div>
                <div className="mac-content">
                    {renderStep()}
                </div>
            </div>
        </Draggable>
    );
};
