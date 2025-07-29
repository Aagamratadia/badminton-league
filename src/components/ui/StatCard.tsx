import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: 'primary' | 'sport';
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon, label, value, variant, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-primary/10 text-primary',
      sport: 'bg-cyan-500/10 text-cyan-600',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground p-6 flex items-center gap-6',
          className
        )}
        {...props}
      >
        <div className={cn('rounded-full p-3', variant ? variantClasses[variant] : variantClasses.sport)}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  }
);
StatCard.displayName = 'StatCard';

export { StatCard };
