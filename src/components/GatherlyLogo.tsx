import React from 'react';

interface GatherlyLogoProps {
    className?: string;
    animate?: boolean;
    onAnimationComplete?: () => void;
}

export const GatherlyLogo: React.FC<GatherlyLogoProps> = ({ className = '', animate = false, onAnimationComplete }) => {
    return (
        <svg
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`gatherly-logo ${className}`}
            style={{ width: '120px', height: '120px' }}
        >
            {/* Clock circle */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            {/* Clock circle - starts at bottom intersection with plus circle, goes CCW to left intersection */}
            <path
                d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animate ? 'logo-path-animate' : ''}
            />

            {/* Clock hands */}
            <path
                d="M13 6V12L17 14"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animate ? 'logo-path-animate' : ''}
            />

            {/* Plus sign circle */}
            <circle
                cx="6"
                cy="16"
                r="5.2"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
                className={animate ? 'logo-dot-animate' : ''}
            />

            {/* Plus sign vertical */}
            <path
                d="M6 14V18"
                stroke="#4ade80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animate ? 'logo-path-animate' : ''}
            />

            {/* Plus sign horizontal - trigger completion on this last element */}
            <path
                d="M4 16H8"
                stroke="#4ade80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animate ? 'logo-path-animate' : ''}
                onAnimationEnd={onAnimationComplete}
            />
        </svg>
    );
};
