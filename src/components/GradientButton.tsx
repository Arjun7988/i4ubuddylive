import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'secondary' | 'hero' | 'magenta' | 'orange' | 'cyan' | 'sunset' | 'warm' | 'coral' | 'fire' | 'rainbow';
  size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: GradientButtonProps) {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-button text-white hover:shadow-glow-button hover:bg-gradient-button-hover hover:scale-[1.02] active:scale-[0.98]',
    accent:
      'bg-gradient-accent text-white hover:shadow-glow-accent hover:scale-[1.02] active:scale-[0.98]',
    hero:
      'bg-gradient-hero text-white hover:shadow-glow-multi hover:scale-[1.02] active:scale-[0.98]',
    magenta:
      'bg-gradient-magenta text-white hover:shadow-glow-magenta hover:scale-[1.02] active:scale-[0.98]',
    orange:
      'bg-gradient-orange text-white hover:shadow-glow-orange hover:scale-[1.02] active:scale-[0.98]',
    cyan:
      'bg-gradient-cyan text-white hover:shadow-glow-accent hover:scale-[1.02] active:scale-[0.98]',
    sunset:
      'bg-gradient-sunset text-white hover:shadow-glow-sunset hover:scale-[1.02] active:scale-[0.98]',
    warm:
      'bg-gradient-warm text-white hover:shadow-glow-warm hover:scale-[1.02] active:scale-[0.98]',
    coral:
      'bg-gradient-coral text-white hover:shadow-glow-coral hover:scale-[1.02] active:scale-[0.98]',
    fire:
      'bg-gradient-fire text-white hover:shadow-glow-sunset hover:scale-[1.02] active:scale-[0.98]',
    rainbow:
      'bg-gradient-rainbow text-white hover:shadow-glow-multi hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'bg-surface border border-border text-gray-200 hover:border-primary-500 hover:shadow-glow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
