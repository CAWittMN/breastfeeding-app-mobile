import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * Which side is currently FULL (i.e., the side the user should feed from next).
 * `both` is the initial / reset state.
 */
export type FeedSide = 'left' | 'right' | 'both' | 'none';

const STORAGE_KEY = 'boobapp.feedState.v1';

type Persisted = {
  fullSide: FeedSide;
  lastFedAt: string | null; // ISO timestamp of last tap
};

const DEFAULT_STATE: Persisted = {
  fullSide: 'both',
  lastFedAt: null,
};

export function useFeedState() {
  const [state, setState] = useState<Persisted>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw));
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Persisted) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  /**
   * User tapped the currently-full side, meaning they just fed from it.
   * That side becomes empty; the opposite side becomes full.
   */
  const recordFeed = useCallback(
    (sideJustUsed: 'left' | 'right') => {
      const opposite: FeedSide = sideJustUsed === 'left' ? 'right' : 'left';
      void persist({
        fullSide: opposite,
        lastFedAt: new Date().toISOString(),
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    void persist({ fullSide: 'both', lastFedAt: null });
  }, [persist]);

  return {
    hydrated,
    fullSide: state.fullSide,
    lastFedAt: state.lastFedAt,
    recordFeed,
    reset,
  };
}
