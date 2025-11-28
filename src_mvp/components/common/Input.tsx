import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2';
  const defaultStyles = 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-opacity-20';
  const errorStyles = 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)] focus:ring-opacity-20';
  
  const inputStyles = [
    baseStyles,
    error ? errorStyles : defaultStyles,
    className
  ].join(' ');

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      
      <input className={inputStyles} {...props} />
      
      {(error || helper) && (
        <p className={`text-sm ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
};

export default Input;
