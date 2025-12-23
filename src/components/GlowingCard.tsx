import { ReactNode } from 'react';

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlowingCard({ children, className = '', hover = true }: GlowingCardProps) {
  return (
    <div
      className={`glass glass-border rounded-xl p-6 ${
        hover ? 'hover:shadow-glow transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
