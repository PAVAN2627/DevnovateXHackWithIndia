import { useState, useEffect } from 'react';

interface RelativeTimeProps {
  timestamp: string;
  format?: 'short' | 'full';
}

export function RelativeTime({ timestamp, format = 'full' }: RelativeTimeProps) {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!timestamp || timestamp === 'undefined' || timestamp === 'null' || timestamp === undefined || timestamp === null) {
        setDisplayTime('Just now');
        return;
      }

      try {
        // Handle various timestamp formats
        let date;
        if (typeof timestamp === 'string' && timestamp.includes('T')) {
          date = new Date(timestamp);
        } else if (typeof timestamp === 'string' && !isNaN(Number(timestamp))) {
          date = new Date(Number(timestamp));
        } else {
          date = new Date(timestamp);
        }
        
        if (isNaN(date.getTime())) {
          setDisplayTime('Just now');
          return;
        }

        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 10) {
          setDisplayTime('Just now');
        } else if (diff < 60) {
          setDisplayTime(`${diff}s ago`);
        } else if (diff < 3600) {
          const minutes = Math.floor(diff / 60);
          setDisplayTime(`${minutes}m ago`);
        } else if (diff < 86400) {
          const hours = Math.floor(diff / 3600);
          setDisplayTime(`${hours}h ago`);
        } else if (diff < 604800) {
          const days = Math.floor(diff / 86400);
          setDisplayTime(`${days}d ago`);
        } else {
          // Show full date for older messages
          if (format === 'full') {
            setDisplayTime(
              date.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          } else {
            setDisplayTime(
              date.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            );
          }
        }
      } catch {
        setDisplayTime('Just now');
      }
    };

    updateTime();
    // Update every 30 seconds
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [timestamp, format]);

  return <span className="text-xs text-muted-foreground">{displayTime}</span>;
}

export function RelativeTimeTooltip(timestamp: string): string {
  if (!timestamp || timestamp === 'undefined' || timestamp === 'null' || timestamp === undefined || timestamp === null) return 'Just now';

  try {
    // Handle various timestamp formats
    let date;
    if (typeof timestamp === 'string' && timestamp.includes('T')) {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string' && !isNaN(Number(timestamp))) {
      date = new Date(Number(timestamp));
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return 'Just now';

    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Just now';
  }
}
