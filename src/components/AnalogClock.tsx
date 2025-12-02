import React, { useEffect, useState } from 'react';

interface AnalogClockProps {
    className?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({ className = '' }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const secondAngle = (seconds / 60) * 360;
    const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
    const hourAngle = ((hours % 12 + minutes / 60) / 12) * 360;

    return (
        <div className="analog-clock">
            <svg
                viewBox="0 0 100 100"
                className={`analog-clock-svg ${className}`}
            >
                {/* Clock Face */}
                <circle cx="50" cy="50" r="48" stroke="var(--text-primary)" strokeWidth="2" fill="none" />

                {/* Hour Hand */}
                <line
                    x1="50" y1="50" x2="50" y2="25"
                    stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round"
                    transform={`rotate(${hourAngle} 50 50)`}
                />

                {/* Minute Hand */}
                <line
                    x1="50" y1="50" x2="50" y2="15"
                    stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round"
                    transform={`rotate(${minuteAngle} 50 50)`}
                />

                {/* Second Hand */}
                <line
                    x1="50" y1="50" x2="50" y2="10"
                    stroke="var(--accent-primary)" strokeWidth="1"
                    transform={`rotate(${secondAngle} 50 50)`}
                />

                {/* Center Dot */}
                <circle cx="50" cy="50" r="3" fill="var(--text-primary)" />
            </svg>
        </div>
    );
};
