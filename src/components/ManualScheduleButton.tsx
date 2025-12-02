import React from 'react';

interface ManualScheduleButtonProps {
    onClick?: () => void;
    inline?: boolean;
    scale?: number;
    disabled?: boolean;
}

export const ManualScheduleButton: React.FC<ManualScheduleButtonProps> = ({ onClick, inline, scale = 1, disabled = false }) => {
    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };
    const baseWidth = 160;
    const baseHeight = 140;

    if (inline) {
        return (
            <div style={{
                display: 'inline-block',
                width: `${baseWidth * scale}px`,
                height: `${baseHeight * scale}px`,
                verticalAlign: '-10px',
                position: 'relative',
                margin: '0 -10px 0 19px'
            }}>
                <div className="d3wrapper" onClick={handleClick} style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    display: 'flex',
                    zIndex: 1000
                }}>
                    <div className="cover">
                        <button className="button" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backfaceVisibility: 'hidden', // Improve rendering
                            WebkitFontSmoothing: 'antialiased',
                            transformStyle: 'preserve-3d'
                        }}>
                            <style>
                                {`
                                @keyframes glisten {
                                    0% { filter: drop-shadow(0 0 2px rgba(74, 222, 128, 0.6)); stroke-opacity: 1; }
                                    50% { filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.9)); stroke-opacity: 0.8; }
                                    100% { filter: drop-shadow(0 0 2px rgba(74, 222, 128, 0.6)); stroke-opacity: 1; }
                                }
                                .glowing-icon {
                                    animation: glisten 2s infinite ease-in-out;
                                    shape-rendering: geometricPrecision;
                                }
                                `}
                            </style>
                            <svg width="95" height="95" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                                <defs>
                                    <pattern id="sparklePattern" patternUnits="userSpaceOnUse" width="95" height="95">
                                        <image href="https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif" x="0" y="0" width="95" height="95" preserveAspectRatio="xMidYMid slice">
                                            {/* Hack to force browser to repaint GIF */}
                                            <animate attributeName="x" values="0;0.1;0" dur="1s" repeatCount="indefinite" />
                                        </image>
                                    </pattern>
                                </defs>
                                <path d="M13 22C18.5228 22 23 17.5228 23 12C23 6.47715 18.5228 2 13 2C7.47715 2 3 6.47715 3 12C3 13.8214 3.48697 15.5291 4.33782 17" stroke="url(#sparklePattern)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13 6V12L17 14" stroke="url(#sparklePattern)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle className="glowing-icon" cx="7" cy="17" r="6.5" fill="none" stroke="#4ade80" strokeWidth="2" />
                                <path className="glowing-icon" d="M7 13.5V20.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path className="glowing-icon" d="M3.5 17H10.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d3wrapper" onClick={handleClick} style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div className="cover">
                <button className="button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backfaceVisibility: 'hidden', // Improve rendering
                    WebkitFontSmoothing: 'antialiased',
                    transformStyle: 'preserve-3d'
                }}>
                    <style>
                        {`
                        @keyframes glisten {
                            0% { filter: drop-shadow(0 0 2px rgba(74, 222, 128, 0.6)); stroke-opacity: 1; }
                            50% { filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.9)); stroke-opacity: 0.8; }
                            100% { filter: drop-shadow(0 0 2px rgba(74, 222, 128, 0.6)); stroke-opacity: 1; }
                        }
                        .glowing-icon {
                            animation: glisten 2s infinite ease-in-out;
                            shape-rendering: geometricPrecision;
                        }
                        `}
                    </style>
                    <svg width="95" height="95" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                        <defs>
                            <pattern id="sparklePattern" patternUnits="userSpaceOnUse" width="95" height="95">
                                <image href="https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif" x="0" y="0" width="95" height="95" preserveAspectRatio="xMidYMid slice">
                                    {/* Hack to force browser to repaint GIF */}
                                    <animate attributeName="x" values="0;0.1;0" dur="1s" repeatCount="indefinite" />
                                </image>
                            </pattern>
                        </defs>
                        <path d="M13 22C18.5228 22 23 17.5228 23 12C23 6.47715 18.5228 2 13 2C7.47715 2 3 6.47715 3 12C3 13.8214 3.48697 15.5291 4.33782 17" stroke="url(#sparklePattern)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13 6V12L17 14" stroke="url(#sparklePattern)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle className="glowing-icon" cx="7" cy="17" r="6.5" fill="none" stroke="#4ade80" strokeWidth="2" />
                        <path className="glowing-icon" d="M7 13.5V20.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path className="glowing-icon" d="M3.5 17H10.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
