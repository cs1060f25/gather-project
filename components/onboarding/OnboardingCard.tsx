import React from 'react';
import Card from '../common/Card';

interface OnboardingCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      <Card className="w-full max-w-md">
        {/* Logo/Icon placeholder */}
        <div className="w-16 h-16 mb-8 mx-auto rounded-2xl bg-[var(--color-primary)] flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          {title}
        </h1>
        
        <p className="text-[var(--color-text-secondary)] text-center mb-8">
          {description}
        </p>

        {children}
      </Card>
    </div>
  );
};

export default OnboardingCard;
