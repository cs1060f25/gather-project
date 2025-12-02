import React from 'react';
import './SquigglyText.css';

interface SquigglyTextProps {
    isTutorialMode?: boolean;
    isVisible?: boolean;
    onDismiss?: () => void;
}

export const SquigglyText: React.FC<SquigglyTextProps> = ({
    isTutorialMode = false,
    isVisible = true,
    onDismiss
}) => {
    if (!isVisible) return null;

    return (
        <>
            <div
                className={`squiggly-container ${isTutorialMode ? 'tutorial-mode' : ''}`}
                onClick={onDismiss}
            >
                <div className="squiggly-text">
                    <span style={{ color: '#FFD700' }}>Intent</span> → <span style={{ color: '#4ade80' }}>Scheduled</span> is EZ for our <span className="gatherly-text">Gatherly 1.0</span> Agent 🐶
                </div>
            </div>

            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="squiggly-0">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="0" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                    </filter>
                    <filter id="squiggly-1">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
                    </filter>
                    <filter id="squiggly-2">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                    </filter>
                    <filter id="squiggly-3">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="3" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
                    </filter>
                    <filter id="squiggly-4">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="4" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                    </filter>
                </defs>
            </svg>
        </>
    );
};
