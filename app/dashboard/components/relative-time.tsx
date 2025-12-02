'use client';

import { useEffect, useState } from 'react';

interface RelativeTimeProps {
  dateString: string;
}

export function RelativeTime({ dateString }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateTime = () => {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 7) {
        setRelativeTime(date.toLocaleDateString());
      } else if (diffDays > 0) {
        setRelativeTime(`${diffDays}d ago`);
      } else if (diffHours > 0) {
        setRelativeTime(`${diffHours}h ago`);
      } else if (diffMinutes > 0) {
        setRelativeTime(`${diffMinutes}m ago`);
      } else {
        setRelativeTime('Just now');
      }
    };

    updateTime();
    
    // Update every minute for accuracy
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [dateString]);

  if (!mounted) {
    // Return a placeholder to avoid hydration mismatch
    return <span>Loading...</span>;
  }

  return (
    <span title={new Date(dateString).toLocaleString()}>
      {relativeTime}
    </span>
  );
}
