import React from 'react';
import { LoadingSpinner } from './loading-spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:ring-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30',
  secondary:
    'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 focus-visible:ring-zinc-500',
  ghost:
    'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-zinc-500',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 focus-visible:ring-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium rounded-lg',
          'transition-all duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner
            size="sm"
            className="text-current"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
