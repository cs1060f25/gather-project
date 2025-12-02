import React, { useState } from 'react';
import { CalendarView } from '../components/CalendarView';
import { ChatInterface } from '../components/ChatInterface';
import { GatherlyLogo } from '../components/GatherlyLogo';
import { OnboardingWindow } from '../components/OnboardingWindow';
import { SquigglyText } from '../components/SquigglyText';

export const Dashboard: React.FC = () => {
    const [showOnboarding, setShowOnboarding] = useState(true);

    return (
        <div className="dashboard-container">
            {showOnboarding && <OnboardingWindow onClose={() => setShowOnboarding(false)} />}
            <header className="dashboard-header">
                <div className="flex-center gap-2">
                    <GatherlyLogo className="w-6 h-6" />
                    <span className="font-semibold">Gatherly</span>
                </div>
                <div className="user-avatar">
                    {/* Placeholder avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500"></div>
                </div>
            </header>

            <main className="dashboard-main">
                <CalendarView />
            </main>

            <ChatInterface />
            <SquigglyText />
        </div>
    );
};
