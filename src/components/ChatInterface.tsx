import React, { useState } from 'react';
import { Briefcase, Coffee, Sparkles, ArrowUp, Plus } from 'lucide-react';

type ChatMode = 'career' | 'social' | 'auto';

export const ChatInterface: React.FC = () => {
    const [mode, setMode] = useState<ChatMode>('auto');
    const [input, setInput] = useState('');

    const handleModeChange = (newMode: ChatMode) => {
        setMode(newMode);
    };

    return (
        <div className="chat-interface-container">
            <div className="chat-bar glass-panel">
                <div className="chat-input-wrapper">
                    <button className="attach-btn">
                        <Plus size={20} />
                    </button>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask Gatherly to schedule..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="mode-toggles">
                        <button
                            className={`mode-btn ${mode === 'career' ? 'active' : ''}`}
                            onClick={() => handleModeChange('career')}
                            title="Career Mode"
                        >
                            <Briefcase size={16} />
                            <span>Career</span>
                        </button>
                        <button
                            className={`mode-btn ${mode === 'social' ? 'active' : ''}`}
                            onClick={() => handleModeChange('social')}
                            title="Social Mode"
                        >
                            <Coffee size={16} />
                            <span>Social</span>
                        </button>
                        <button
                            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
                            onClick={() => handleModeChange('auto')}
                            title="Auto Mode"
                        >
                            <Sparkles size={16} />
                            <span>Auto</span>
                        </button>
                    </div>
                    <button className="send-btn" disabled={!input.trim()}>
                        <ArrowUp size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
