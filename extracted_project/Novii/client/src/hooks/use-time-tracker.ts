import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/language-context';

export function useTimeTracker() {
  const { user } = useAuth();
  const { direction } = useLanguage();
  const sessionStartTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningsShownRef = useRef<Set<number>>(new Set());
  const lastSentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    // Set session start time on mount
    sessionStartTimeRef.current = Date.now();
    console.log('🕐 Time tracker started');
    
    // Warning thresholds in seconds (only for current session)
    const WARNING_THRESHOLDS = [3600, 5400, 7200, 9000, 10800]; // 1h, 1.5h, 2h, 2.5h, 3h
    
    // Update every 10 seconds for better accuracy
    const updateTime = () => {
      // Calculate time spent in THIS session only
      const currentSessionMs = Date.now() - sessionStartTimeRef.current;
      const currentSessionSeconds = Math.floor(currentSessionMs / 1000);
      
      console.log('⏱️ Time updated:', currentSessionSeconds, 'seconds (', Math.floor(currentSessionSeconds / 60), 'minutes )');
      
      // Check if we need to show a break warning
      for (const threshold of WARNING_THRESHOLDS) {
        if (currentSessionSeconds >= threshold && !warningsShownRef.current.has(threshold)) {
          warningsShownRef.current.add(threshold);
          
          // Show warning toast
          const hours = Math.floor(threshold / 3600);
          const minutes = Math.floor((threshold % 3600) / 60);
          
          const title = direction === 'rtl' 
            ? `⏰ كنت قاعد ${hours}${minutes ? ` ساعة و ${minutes} دقيقة` : ' ساعة'}`
            : `⏰ You've been here for ${hours}h${minutes ? ` ${minutes}m` : ''}`;
          
          const message = direction === 'rtl'
            ? '😴 ارتاح شوية! اترك الهاتف وخذ break قصير'
            : '😴 Take a break! Step away and rest for a bit';
          
          toast.error(message, {
            description: title,
            duration: 8000,
          });
          
          console.log('⚠️ Break reminder shown at:', threshold, 'seconds');
        }
      }
      
      // Send to backend every 5 minutes
      if (currentSessionSeconds > 0 && currentSessionSeconds - lastSentTimeRef.current >= 300) {
        lastSentTimeRef.current = currentSessionSeconds;
        console.log('📤 Sending time to backend:', currentSessionSeconds);
        api.updateTimeSpent(currentSessionSeconds).catch(err => {
          console.error('Failed to update time spent:', err);
        });
      }
    };

    // Start the interval - update every 10 seconds
    intervalRef.current = setInterval(updateTime, 10000);
    
    // Call once immediately to show current time
    updateTime();

    // Save time on page unload
    const handleBeforeUnload = () => {
      const currentSessionMs = Date.now() - sessionStartTimeRef.current;
      const currentSessionSeconds = Math.floor(currentSessionMs / 1000);
      
      console.log('👋 Saving final time on unload:', currentSessionSeconds);
      
      if (currentSessionSeconds > 0) {
        // Send final update
        navigator.sendBeacon('/api/time-spent', JSON.stringify({ seconds: currentSessionSeconds }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, direction]);
}
