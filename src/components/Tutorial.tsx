import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Tutorial.css';
import './TutorialArrows.css';
import { ManualScheduleButton } from './ManualScheduleButton';

interface TutorialStep {
    id: string;
    title: string;
    message: React.ReactNode;
    targetSelector?: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: 'type' | 'click' | 'none';
}

const getWelcomeMessage = (
    setHoverTarget: (target: 'type' | 'click' | null) => void
) => (
    <span>
        To create an event,{' '}
        <strong
            onMouseEnter={() => setHoverTarget('type')}
            onMouseLeave={() => setHoverTarget(null)}
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            just type
        </strong>
        . You can also{' '}
        <strong
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            click
        </strong>{' '}
        <ManualScheduleButton inline scale={0.17} /> in the middle to login or just schedule manually. Happy gathering!
    </span>
);

const tutorialSteps: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Gatherly!',
        message: null as any, // Will be set dynamically
        position: 'center',
        action: 'none'
    },
    {
        id: 'type',
        title: 'Create an Event',
        message: "Just start typing what you want to schedule, or click the 🎤 mic button to use your voice! Try: 'Schedule a coffee chat with Sarah'",
        targetSelector: '.input-container',
        position: 'bottom',
        action: 'type'
    },
    {
        id: 's-button',
        title: 'Manual Scheduling',
        message: 'Click the big clock in the middle to open the manual scheduler or login to your account',
        targetSelector: '.d3wrapper .button',
        position: 'top',  // Position above the button, centered
        action: 'click'
    }
];

interface TutorialProps {
    onComplete: () => void;
    onSkip: () => void;
    inputValue: string;
    setInputValue: (value: string) => void;
    onStepChange?: (stepId: string) => void;
}

export const Tutorial: React.FC<TutorialProps> = ({
    onComplete,
    onSkip,
    inputValue: _inputValue,
    setInputValue,
    onStepChange
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    const [hoverTarget, setHoverTarget] = useState<'type' | 'click' | null>(null);
    const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Use a step key to track when step actually changes for animation purposes
    const [stepKey, setStepKey] = useState(0);
    
    const animationTimerRef = useRef<number | null>(null);
    const typeIntervalRef = useRef<number | null>(null);
    const autoPlayTimerRef = useRef<number | null>(null);
    const stepKeyRef = useRef(stepKey);
    
    // Mark as initialized after first render
    useEffect(() => {
        const timer = setTimeout(() => setHasInitialized(true), 300);
        return () => clearTimeout(timer);
    }, []);

    // Notify parent of step changes
    useEffect(() => {
        if (onStepChange) {
            onStepChange(tutorialSteps[currentStep]?.id || 'welcome');
        }
    }, [currentStep, onStepChange]);

    // Keep ref in sync with state
    useEffect(() => {
        stepKeyRef.current = stepKey;
    }, [stepKey]);

    // Lock body scroll when tutorial is active
    useEffect(() => {
        document.body.classList.add('tutorial-active');
        return () => {
            document.body.classList.remove('tutorial-active');
        };
    }, []);

    // Set the welcome message dynamically with hover handlers
    const currentStepData = currentStep === 0
        ? { ...tutorialSteps[currentStep], message: getWelcomeMessage(setHoverTarget) }
        : tutorialSteps[currentStep];

    // Clear all animations and timers
    const clearAllAnimations = useCallback(() => {
        if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current);
            typeIntervalRef.current = null;
        }
        if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
            animationTimerRef.current = null;
        }
        if (autoPlayTimerRef.current) {
            clearTimeout(autoPlayTimerRef.current);
            autoPlayTimerRef.current = null;
        }
        // Remove any lingering click animation class
        const sButton = document.querySelector('.d3wrapper .button');
        if (sButton) {
            sButton.classList.remove('tutorial-click-animation');
        }
    }, []);

    useEffect(() => {
        const updateTargetRect = () => {
            if (currentStepData.targetSelector) {
                const element = document.querySelector(currentStepData.targetSelector);
                if (element) {
                    setTargetRect(element.getBoundingClientRect());
                }
            } else {
                setTargetRect(null);
            }
        };
        
        // Initial calculation with small delay to ensure DOM is ready
        const timer = setTimeout(updateTargetRect, 50);
        
        // Only update on window resize, not during animations
        const handleResize = () => {
            updateTargetRect();
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [currentStep, currentStepData.targetSelector]);

    // Reset animation state when stepKey changes (indicates a real step transition)
    useEffect(() => {
        setHasPlayedAnimation(false);
        setIsAnimating(false);
        setInputValue('');
    }, [stepKey, setInputValue]);

    // Play typing demo with step key validation
    const playTypingDemo = useCallback((forStepKey: number) => {
        // Check if we're still on the same step
        if (stepKeyRef.current !== forStepKey) return;
        
        setIsAnimating(true);
        setHasPlayedAnimation(true);
        const demoText = "Schedule a coffee chat with Sarah";
        let currentChar = 0;

        typeIntervalRef.current = window.setInterval(() => {
            // Validate we're still on the same step during animation
            if (stepKeyRef.current !== forStepKey) {
                if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
                return;
            }
            
            if (currentChar < demoText.length) {
                setInputValue(demoText.slice(0, currentChar + 1));
                currentChar++;
            } else {
                if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
                animationTimerRef.current = window.setTimeout(() => {
                    if (stepKeyRef.current === forStepKey) {
                    setIsAnimating(false);
                    }
                }, 400);
            }
        }, 40);
    }, [setInputValue]);

    // Play S button click demo with step key validation
    const playClickDemo = useCallback((forStepKey: number) => {
        // Check if we're still on the same step
        if (stepKeyRef.current !== forStepKey) return;
        
        setIsAnimating(true);
        setHasPlayedAnimation(true);

        animationTimerRef.current = window.setTimeout(() => {
            if (stepKeyRef.current !== forStepKey) return;
            
            const sButton = document.querySelector('.d3wrapper .button');
            if (sButton) {
                sButton.classList.add('tutorial-click-animation');

                animationTimerRef.current = window.setTimeout(() => {
                    sButton.classList.remove('tutorial-click-animation');
                    if (stepKeyRef.current === forStepKey) {
                    setIsAnimating(false);
                    }
                }, 500);
            }
        }, 150);
    }, []);

    // Auto-play demos with proper step key tracking
    useEffect(() => {
        const currentKey = stepKey;
        const action = tutorialSteps[currentStep]?.action;
        
        if (action === 'type' || action === 'click') {
            // Delay auto-play to allow step transition to complete
            autoPlayTimerRef.current = window.setTimeout(() => {
                if (stepKeyRef.current === currentKey) {
                    if (action === 'type') {
                        playTypingDemo(currentKey);
                    } else if (action === 'click') {
                        playClickDemo(currentKey);
                    }
                }
            }, 200);
        }
        
        return () => {
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
            }
        };
    }, [stepKey, currentStep, playTypingDemo, playClickDemo]);

    const handleNext = useCallback(() => {
        if (isTransitioning) return;
        
        // Clear all animations immediately
        clearAllAnimations();
        setIsAnimating(false);
        setInputValue('');

        if (currentStep < tutorialSteps.length - 1) {
            // Fade out, change step, fade in - with longer timings for smooth transition
            setIsTransitioning(true);
            setTimeout(() => {
            setCurrentStep(currentStep + 1);
                setStepKey(prev => prev + 1);
                setTimeout(() => setIsTransitioning(false), 150);
            }, 200);
        } else {
            onComplete();
        }
    }, [currentStep, clearAllAnimations, setInputValue, onComplete, isTransitioning]);

    const handlePrevious = useCallback(() => {
        if (isTransitioning) return;
        
        // Clear all animations immediately
        clearAllAnimations();
        setIsAnimating(false);
        setInputValue('');

        if (currentStep > 0) {
            // Fade out, change step, fade in - with longer timings for smooth transition
            setIsTransitioning(true);
            setTimeout(() => {
            setCurrentStep(currentStep - 1);
                setStepKey(prev => prev + 1);
                setTimeout(() => setIsTransitioning(false), 150);
            }, 200);
        }
    }, [currentStep, clearAllAnimations, setInputValue, isTransitioning]);

    const handleSkipClick = () => {
        setShowSkipConfirm(true);
    };

    const handleSkipConfirm = () => {
        setShowSkipConfirm(false);
        onSkip();
    };

    const handleSkipCancel = () => {
        setShowSkipConfirm(false);
    };

    const getMessagePosition = () => {
        if (!targetRect || currentStepData.position === 'center') {
            return {
                bottom: '40px',
                left: '40px',
                transform: 'none'
            };
        }

        const padding = 20;
        
        switch (currentStepData.position) {
            case 'bottom':
                // Align with the text box (same left as the spotlight)
                return {
                    top: `${targetRect.bottom + padding + 10}px`,
                    left: `${targetRect.left - 20}px`,
                    transform: 'none'
                };
            case 'top':
                // Position above the button, align with left edge of spotlight
                return {
                    bottom: `${window.innerHeight - targetRect.top + padding + 30}px`,
                    left: `${targetRect.left - 20}px`,
                    transform: 'none'
                };
            case 'left':
                return {
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    left: '40px',
                    transform: 'translateY(-50%)'
                };
            case 'right':
                return {
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    left: '40px',
                    transform: 'translateY(-50%)'
                };
            default:
                return {};
        }
    };

    return (
        <div className="tutorial-overlay">
            {/* Dark overlay only for steps without a target (welcome step) */}
            {!targetRect && <div className={`tutorial-dark-overlay ${isTransitioning ? 'transitioning' : ''}`} />}

            {/* Spotlight Effect - creates dark overlay with transparent cutout */}
            {targetRect && (
                <div
                    className={`tutorial-spotlight ${isTransitioning ? 'transitioning' : ''}`}
                    style={{
                        top: `${targetRect.top - (currentStepData.id === 's-button' ? 30 : 25)}px`,
                        left: `${targetRect.left - 25}px`,
                        width: `${targetRect.width + (currentStepData.id === 'type' ? 100 : 50)}px`,
                        height: `${targetRect.height + (currentStepData.id === 's-button' ? 60 : 50)}px`
                    }}
                />
            )}

            {/* Hover Arrows */}
            {currentStep === 0 && hoverTarget === 'type' && (
                <div className="tutorial-arrow-container">
                    <div className="tutorial-arrow tutorial-arrow-type">
                        <svg width="60" height="80" viewBox="0 0 60 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                            <defs>
                                <marker id="arrowhead-type" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                    <polygon points="0 0, 10 5, 0 10" fill="#4CAF50" />
                                </marker>
                            </defs>
                            <path
                                d="M 30 75 Q 30 40, 30 10"
                                stroke="#4CAF50"
                                strokeWidth="3"
                                fill="none"
                                markerEnd="url(#arrowhead-type)"
                                className="tutorial-arrow-path"
                            />
                        </svg>
                    </div>
                </div>
            )}

            {/* Message Box */}
            <div className={`tutorial-message ${hasInitialized ? 'no-animate' : ''} ${isTransitioning ? 'transitioning' : ''}`} style={getMessagePosition()}>
                <h3 className="tutorial-title">{currentStepData.title}</h3>
                <p className="tutorial-text">{currentStepData.message}</p>

                <div className="tutorial-controls">
                    <div className="tutorial-progress">
                        {currentStep + 1} / {tutorialSteps.length}
                    </div>

                    <div className="tutorial-buttons">
                        {currentStep > 0 && (
                            <button 
                                className="tutorial-btn tutorial-btn-secondary" 
                                onClick={handlePrevious}
                                disabled={isAnimating}
                            >
                                Previous
                            </button>
                        )}
                        {(currentStepData.action === 'type' || currentStepData.action === 'click') && (
                            <button
                                className="tutorial-btn tutorial-btn-secondary"
                                onClick={() => {
                                    if (isAnimating) return;
                                    clearAllAnimations();
                                    setInputValue('');
                                    // Small delay to ensure clean state
                                    setTimeout(() => {
                                        if (currentStepData.action === 'type') {
                                            playTypingDemo(stepKey);
                                        } else {
                                            playClickDemo(stepKey);
                                        }
                                    }, 50);
                                }}
                                disabled={isAnimating}
                            >
                                {isAnimating ? 'Playing...' : hasPlayedAnimation ? 'Replay' : 'Play Demo'}
                            </button>
                        )}
                        <button
                            className="tutorial-btn tutorial-btn-primary"
                            onClick={handleNext}
                            disabled={isAnimating}
                        >
                            {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Finish'}
                        </button>
                        {currentStep < tutorialSteps.length - 1 && (
                            <button
                                className="tutorial-btn tutorial-btn-skip"
                                onClick={handleSkipClick}
                                disabled={isAnimating}
                                aria-label="Skip tutorial"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4 18l8.5-6L4 6v12zm2-8.14L9.86 12 6 14.14V9.86zM13 6v12l8.5-6L13 6zm2 8.14L18.86 12 15 9.86v4.28z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Skip Confirmation Dialog */}
            {showSkipConfirm && (
                <div className="tutorial-confirm-overlay">
                    <div className="tutorial-confirm-dialog">
                        <h3 className="tutorial-confirm-title">Skip Tutorial?</h3>
                        <p className="tutorial-confirm-text">
                            Are you sure you want to skip the entire tutorial? You won't see this again.
                        </p>
                        <div className="tutorial-confirm-buttons">
                            <button className="tutorial-btn tutorial-btn-secondary" onClick={handleSkipCancel}>
                                Cancel
                            </button>
                            <button className="tutorial-btn tutorial-btn-primary" onClick={handleSkipConfirm}>
                                Skip Tutorial
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
