import * as React from 'react';
import { cn } from '@/lib/utils';

const ProfileCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-sm animate-fade-in',
      className
    )}
    {...props}
  />
));
ProfileCard.displayName = 'ProfileCard';

export { ProfileCard };
