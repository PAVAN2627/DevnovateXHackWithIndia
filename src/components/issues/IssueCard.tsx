import { Clock, User } from 'lucide-react';
import { Issue } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const statusColors = {
    open: 'bg-info/20 text-info border-info/30',
    'in-progress': 'bg-warning/20 text-warning border-warning/30',
    resolved: 'bg-success/20 text-success border-success/30',
    closed: 'bg-muted text-muted-foreground border-muted',
  };

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-info/20 text-info',
    high: 'bg-warning/20 text-warning',
    critical: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="glass rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <Badge className={cn('border', statusColors[issue.status])}>
            {issue.status.replace('-', ' ')}
          </Badge>
          <Badge className={priorityColors[issue.priority]}>
            {issue.priority}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">#{issue.id}</span>
      </div>

      <h3 className="font-semibold mb-2">{issue.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {issue.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {issue.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
              {issue.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{issue.author.name}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
