import React, { useState, useRef, useCallback } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

// Mac-style Alert Dialog Component
const MacAlert: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="mac-alert-overlay">
        <div className="mac-alert-dialog">
            <div className="mac-alert-titlebar"></div>
            <div className="mac-alert-content">
                <p className="mac-alert-message">{message}</p>
                <div className="mac-alert-buttons">
                    <button className="mac-alert-btn" onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    </div>
);

// OpenAI API for text cleanup
const cleanupWithOpenAI = async (rawText: string): Promise<string> => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a scheduling assistant that converts voice input into event scheduling requests. Your job is to take whatever the user says and turn it into a clean, actionable scheduling query. Fix spelling, grammar, and punctuation. If the user is thinking out loud, rambling, or asking a question, extract the scheduling intent and convert it into a concise event description. Examples: "uh maybe I should like meet with John sometime next week about the project" → "Meet with John next week about the project". "What if I scheduled a dentist appointment for Tuesday" → "Dentist appointment Tuesday". Always output ONLY the cleaned scheduling text, nothing else. Never answer questions or provide explanations.'
                    },
                    {
                        role: 'user',
                        content: rawText
                    }
                ],
                max_tokens: 200,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            console.warn('OpenAI cleanup failed, using raw text');
            return rawText;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || rawText;
    } catch (error) {
        console.warn('OpenAI cleanup error:', error);
        return rawText;
    }
};

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const transcriptRef = useRef<string>('');

    // Process transcript with OpenAI cleanup
    const processTranscript = useCallback(async (rawText: string) => {
        setIsProcessing(true);
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        let finalText = rawText;
        
        if (apiKey) {
            finalText = await cleanupWithOpenAI(rawText);
        }
        
        setIsProcessing(false);
        onTranscript(finalText);
    }, [onTranscript]);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setAlertMessage('Speech recognition is not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;  // Keep listening until manually stopped
        recognition.interimResults = true;  // Show results as user speaks
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            transcriptRef.current = '';
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Build up the transcript from all results
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            transcriptRef.current = finalTranscript;
            // Show live preview (final + interim)
            onTranscript((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setIsListening(false);
                setIsProcessing(false);
            }
            
            if (event.error === 'not-allowed') {
                setAlertMessage('Microphone access denied. Please allow microphone access to use voice input.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [onTranscript]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            
            // Process the transcript with OpenAI cleanup
            if (transcriptRef.current.trim()) {
                processTranscript(transcriptRef.current.trim());
            }
        }
    }, [processTranscript]);

    const handleClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <>
        {/* SVG Filter for Liquid Glass Effect */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="frosted-mic" primitiveUnits="objectBoundingBox">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/>
            </filter>
        </svg>
        
        {alertMessage && (
            <MacAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <button
            className={`voice-input-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleClick}
            disabled={disabled || isProcessing}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            title={isListening ? 'Click to stop' : 'Click to speak'}
        >
            {isProcessing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
                    </circle>
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
            )}
            
            {isListening && (
                <span className="voice-pulse"></span>
            )}
        </button>
        </>
    );
};

// TypeScript declarations for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    }
}

