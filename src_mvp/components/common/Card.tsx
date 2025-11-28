import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
}) => {
  const baseStyles = 'bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-md)] p-6';
  const hoverStyles = hover ? 'hover-scale cursor-pointer' : '';
  const styles = [baseStyles, hoverStyles, className].join(' ');

  return (
    <div className={styles} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
