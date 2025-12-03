import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ManualScheduleButton } from '../components/ManualScheduleButton';
import { LocalInfo } from '../components/LocalInfo';
import { VisionProMenu } from '../components/VisionProMenu';
import { Tutorial } from '../components/Tutorial';
import { SquigglyText } from '../components/SquigglyText';
import { VoiceInput } from '../components/VoiceInput';
import { Sketchpad } from '../components/Sketchpad';

const suggestions = [
  "Schedule a coffee chat with Sarah",
  "Book a team sync for Tuesday",
  "Plan a lunch with the design team",
  "Set up a 1:1 with Mike",
  "Organize a project kickoff"
];

const TUTORIAL_KEY = 'gatherly_tutorial_completed';

export const LandingPage: React.FC = () => {
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fade, setFade] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSquigglyText, setShowSquigglyText] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<string>('welcome');
  const [showSketchpad, setShowSketchpad] = useState(false);

  // Determine what should be disabled based on tutorial step
  const isInputDisabled = showTutorial && tutorialStep === 's-button';
  const isButtonDisabled = showTutorial && tutorialStep !== 's-button';

  // Check if tutorial has been completed
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (inputValue) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        setFade(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // If no input, use current suggestion
      if (!inputValue) {
        setInputValue(suggestions[suggestionIndex]);
      } else {
        // If partial input, find matching suggestion (case-insensitive)
        const match = suggestions.find(s => s.toLowerCase().startsWith(inputValue.toLowerCase()));
        if (match) {
          setInputValue(match);
        }
      }
      setShowSquigglyText(false);
    }
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      setShowSquigglyText(false);
      setIsModalOpen(true);
    }
  };

  const handleOpenModal = () => {
    setShowSquigglyText(false);
    // Delay to let button animation complete on mobile
    setTimeout(() => {
      setIsModalOpen(true);
    }, 150);
  };

  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
    setInputValue(''); // Clear the input after tutorial
  };

  const handleTutorialSkip = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
    setInputValue(''); // Clear the input after tutorial
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setShowSquigglyText(false);
    }
    setInputValue(e.target.value);
  };

  const handleVoiceTranscript = (text: string) => {
    setInputValue(text);
    setShowSquigglyText(false);
  };

  const handleSketchTranscript = (text: string) => {
    setInputValue(text);
    setShowSquigglyText(false);
  };

  return (
    <div className="landing-page-minimal">
      {showTutorial && (
        <Tutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onStepChange={setTutorialStep}
        />
      )}

      {!isModalOpen && <ThemeToggle />}

      <main className="landing-main-left">
        <div className="input-container">
          <div className="input-row">
            <div className="input-wrapper">
              <input
                type="text"
                className="minimal-input"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={2000}
                disabled={isInputDisabled}
                style={{ opacity: isInputDisabled ? 0.5 : 1 }}
              />

              {inputValue.length >= 1800 && (
                <div className="char-limit-warning">
                  {inputValue.length} / 2000 characters
                </div>
              )}

              {!inputValue && (
                <div className={`input-placeholder ${fade ? 'visible' : 'hidden'}`} style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.5s' }}>
                  {suggestions[suggestionIndex]}
                  <span className="tab-hint">tab</span>
                </div>
              )}

              {inputValue && suggestions.find(s => s.toLowerCase().startsWith(inputValue.toLowerCase())) && (
                <div className="input-placeholder" style={{ opacity: 0.5 }}>
                  {inputValue}
                  <span style={{ color: 'var(--bg-tertiary)' }}>
                    {suggestions.find(s => s.toLowerCase().startsWith(inputValue.toLowerCase()))?.slice(inputValue.length)}
                  </span>
                  <span className="tab-hint">tab</span>
                </div>
              )}

              {/* VoiceInput rendered once, outside conditionals to prevent remounting during recording */}
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={isInputDisabled} />
            </div>
            <ManualScheduleButton onClick={handleOpenModal} disabled={isButtonDisabled} />
          </div>

          <div className="mt-4">
            <span className="enter-hint">
              press <strong>tab</strong> to complete, <strong>enter</strong> to start<span className="hint-separator"> — or </span><span 
                className="feeling-lucky" 
                onClick={() => !isInputDisabled && setShowSketchpad(true)}
                role="button"
                tabIndex={0}
              >I'm feeling lucky ✏️</span>
            </span>
          </div>
        </div>
      </main>

      {!isModalOpen && (
        <div className="bottom-right-info">
          <LocalInfo />
        </div>
      )}

      <VisionProMenu
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialInput={inputValue}
      />

      <SquigglyText
        isTutorialMode={showTutorial}
        isVisible={showSquigglyText}
        onDismiss={() => setShowSquigglyText(false)}
      />

      {showSketchpad && (
        <Sketchpad
          onTranscript={handleSketchTranscript}
          onClose={() => setShowSketchpad(false)}
        />
      )}
    </div>
  );
};
