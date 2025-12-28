'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, ...props }, ref) => (
    <div className="relative">
      {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">{leftIcon}</div>}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-[#1A2742] dark:border-[#293548] dark:text-white',
          error ? 'border-red-500' : 'border-slate-200 dark:border-[#293548]',
          leftIcon && 'pl-10',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';