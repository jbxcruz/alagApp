'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#293548] shadow-card dark:shadow-dark-card',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';