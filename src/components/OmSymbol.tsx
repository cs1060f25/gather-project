import React from 'react';
import omImage from '../assets/om.png';

interface OmSymbolProps {
    className?: string;
    animate?: boolean;
}

export const OmSymbol: React.FC<OmSymbolProps> = ({ className = '', animate = false }) => {
    return (
        <img
            src={omImage}
            alt="Om Symbol"
            className={`om-symbol ${className} ${animate ? 'fade-in' : ''}`}
            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
        />
    );
};
