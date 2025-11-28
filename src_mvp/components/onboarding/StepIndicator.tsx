import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  steps: Array<{
    title: string;
    description: string;
  }>;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-[var(--color-border)] rounded-full" />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Step circle */}
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center 
                    ${isCompleted ? 'bg-[var(--color-primary)]' : 
                      isCurrent ? 'bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/20' : 
                      'bg-[var(--color-border)]'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-sm ${isCurrent ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step info */}
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">
          {steps[currentStep].title}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {steps[currentStep].description}
        </p>
      </div>
    </div>
  );
};

export default StepIndicator;
