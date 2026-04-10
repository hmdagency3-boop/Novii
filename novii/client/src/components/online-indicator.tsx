import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import './online-indicator.css';

interface OnlineIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  shouldShow?: boolean; // If false, won't show the indicator
}

export const OnlineIndicator = ({ userId, size = 'md', shouldShow = true }: OnlineIndicatorProps) => {
  // Return null if shouldn't show
  if (!shouldShow) return null;
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');

  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        const status = await api.getUserOnlineStatus(userId);
        // Explicitly set boolean values
        setIsOnline(status.is_online === true);
        setLastSeen(status.last_seen || new Date().toISOString());
      } catch (error) {
        console.error('Failed to fetch online status:', error);
        setIsOnline(false);
      }
    };

    fetchOnlineStatus();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchOnlineStatus, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const getLastSeenText = (): string => {
    if (isOnline) return 'نشط الآن';
    
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'نشط الآن';
    if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    
    return lastSeenDate.toLocaleDateString('ar-SA');
  };

  return (
    <div className="group relative">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-background transition-all duration-300 ${
          isOnline
            ? 'bg-green-500 animate-pulse-glow'
            : 'bg-gray-400'
        }`}
      />
      <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 mt-1 whitespace-nowrap z-50 bottom-full left-1/2 -translate-x-1/2 mb-1">
        {getLastSeenText()}
      </div>
    </div>
  );
};
