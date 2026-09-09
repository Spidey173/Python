'use client';

import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#1F6FEB] focus-visible:outline-offset-2';

    const variantStyles = {
      primary:
        'bg-[#238636] hover:bg-[#2EA043] text-white font-semibold active:bg-[#238636] border border-transparent shadow-none',
      secondary:
        'bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] border border-[#30363D] active:bg-[#161B22]',
      ghost:
        'bg-transparent hover:bg-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] active:bg-[#161B22] border border-transparent',
      danger:
        'bg-[#DA3633] hover:bg-[#B62324] text-white active:bg-[#8E1B19] border border-transparent',
    }[variant];

    const sizeStyles = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-[13px] gap-2',
      lg: 'h-10 px-4 text-sm gap-2.5',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
