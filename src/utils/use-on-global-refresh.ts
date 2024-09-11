import { useEffect } from 'react';

export function useOnGlobalRefresh(callback: () => void) {
  useEffect(() => {
    const listener = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    document.addEventListener('visibilitychange', listener);

    return () => document.removeEventListener('visibilitychange', listener);
  }, [callback]);
}
