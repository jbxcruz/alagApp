'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ className, src, fallback, size = 'md', ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' };
  const initials = fallback?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/30', sizes[size], className)} {...props}>
      {src && !error ? (
        <img src={src} alt="Avatar" className="h-full w-full object-cover" onError={() => setError(true)} />
      ) : (
        <span className="font-medium text-primary-600 dark:text-primary-400">{initials || '?'}</span>
      )}
    </div>
  );
}
