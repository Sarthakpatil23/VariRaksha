/**
 * VariRaksha — Network Status Hook & Service
 *
 * Realtime detection of online/offline status across mobile and web.
 * Safe for React Native Hermes runtime (guards against missing window.addEventListener).
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    // 1. Web-only event listeners (guarded for React Native Hermes compatibility)
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    }
  }, []);

  useEffect(() => {
    // 2. Periodic heartbeat ping (every 6 seconds) to detect real internet reachability
    let isMounted = true;

    const checkConnectivity = async () => {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (isMounted) setIsOffline(true);
        return;
      }

      try {
        // Fast lightweight HEAD request with 2.5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch('https://tbxlgbxlorsuiaoedrns.supabase.co/rest/v1/', {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (isMounted) {
          setIsOffline(!response.ok && response.status === 0);
        }
      } catch (err: any) {
        if (isMounted) {
          // If fetch fails with Network Error / Timeout, device is offline
          setIsOffline(true);
        }
      }
    };

    // Initial check
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOffline, isOnline: !isOffline };
}

export default useNetworkStatus;
