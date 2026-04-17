import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { formatLastSeen } from '@/lib/presence-translations';
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
  const { language } = useLanguage();

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

  const getLastSeenText = (): string => formatLastSeen(lastSeen, language.code, isOnline);

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
