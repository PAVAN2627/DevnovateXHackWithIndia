import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  onClick?: () => void;
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, onClick }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "glass rounded-xl p-3 md:p-6 card-hover",
        onClick && "cursor-pointer hover:shadow-glow transition-all"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-xl md:text-3xl font-bold mt-1">{value}</p>
          {change && (
            <p className={cn(
              'text-xs md:text-sm mt-1 md:mt-2 truncate',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ml-2">
          <Icon className="h-4 w-4 md:h-6 md:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
