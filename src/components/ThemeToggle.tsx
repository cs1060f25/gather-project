import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const body = document.body;
        if (isDark) {
            body.classList.add('dark-mode');
            body.dataset.darkMode = 'true';
        } else {
            body.classList.remove('dark-mode');
            body.dataset.darkMode = 'false';
        }
    }, [isDark]);

    return (
        <label htmlFor="dark-mode" className="theme-toggle-label" data-dark-mode={isDark ? 'true' : 'false'}>
            <div className="switch">
                <input
                    id="dark-mode"
                    type="checkbox"
                    checked={isDark}
                    onChange={(e) => setIsDark(e.target.checked)}
                />
                <div className="insetcover">
                    <div className="sun-moon sun"></div>
                    <div className="sun-moon moon"></div>
                    <div className="stars"></div>
                </div>
                <div className="sun-moon-shadow"></div>
                <div className="shadow-overlay"></div>
            </div>
        </label>
    );
};
