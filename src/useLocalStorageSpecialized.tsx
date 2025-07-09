import { useCallback, useEffect, useRef, useState } from "react";

import { LocalStorageOptions } from "./localStorage.types";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Hook for caching API responses or expensive computations in localStorage
 */
export function useLocalStorageCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: LocalStorageOptions & {
    staleTime?: number; // Time in ms after which data is considered stale
    cacheTime?: number; // Time in ms to keep data in cache (overrides TTL)
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 30 * 60 * 1000, // 30 minutes default
    refetchOnMount = false,
    refetchOnReconnect = true,
    refetchOnWindowFocus = false,
    ...localStorageOptions
  } = options;

  const [data, { setValue, removeValue, getCreatedAt, ...methods }] =
    useLocalStorage<T | null>(key, null, {
      ...localStorageOptions,
      ttl: cacheTime
    });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const fetcherRef = useRef(fetcher);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Check if data is stale
  useEffect(() => {
    const createdAt = getCreatedAt();

    if (createdAt && data) {
      const age = Date.now() - createdAt;
      setIsStale(age > staleTime);
    }
  }, [data, staleTime, getCreatedAt]);

  const fetchData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setValue(result);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, setValue]);

  const invalidate = useCallback(() => {
    removeValue();
    setIsStale(true);
  }, [removeValue]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (!data || refetchOnMount) {
      fetchData();
    }
  }, []);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      if (isStale || !data) {
        fetchData();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => window.removeEventListener("online", handleOnline);
  }, [refetchOnReconnect, isStale, data, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, isStale, fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    invalidate,
    refetch,
    ...methods
  };
}

/**
 * Hook for localStorage with sync across multiple components
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
) {
  const [value, { setValue, ...methods }] = useLocalStorage<T>(
    key,
    initialValue,
    options
  );
  const [subscribers, setSubscribers] = useState<Set<(value: T) => void>>(
    new Set()
  );

  const subscribe = useCallback((callback: (value: T) => void) => {
    setSubscribers((prev) => new Set([...prev, callback]));

    return () => {
      setSubscribers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);

        return newSet;
      });
    };
  }, []);

  const syncedSetValue = useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);

      // Notify all subscribers
      subscribers.forEach((callback) => callback(valueToStore));
    },
    [value, setValue, subscribers]
  );

  return {
    value,
    setValue: syncedSetValue,
    subscribe,
    ...methods
  };
}

/**
 * Hook for localStorage with compression for large data
 */
export function useLocalStorageCompressed<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
) {
  const compressedOptions: LocalStorageOptions = {
    ...options,
    serialize: (value: unknown) => {
      const jsonString = JSON.stringify(value);
      // Simple compression simulation (in real app, use a proper compression library)

      return btoa(jsonString);
    },
    deserialize: (value: string) => {
      try {
        const jsonString = atob(value);

        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    }
  };

  return useLocalStorage<T>(key, initialValue, compressedOptions);
}

/**
 * Hook for localStorage with automatic cleanup of expired items
 */
export function useLocalStorageAutoCleanup() {
  const [cleanupStats, setCleanupStats] = useState({
    lastCleanup: 0,
    itemsRemoved: 0,
    totalRuns: 0
  });

  const runCleanup = useCallback(() => {
    if (typeof window === "undefined") return;

    let removedCount = 0;
    const keys = Object.keys(window.localStorage);

    keys.forEach((key) => {
      try {
        const item = window.localStorage.getItem(key);

        if (item) {
          const data = JSON.parse(item);

          if (data.expiresAt && Date.now() > data.expiresAt) {
            window.localStorage.removeItem(key);
            removedCount++;
          }
        }
      } catch {
        // Ignore items that aren't in our format
      }
    });

    setCleanupStats((prev) => ({
      lastCleanup: Date.now(),
      itemsRemoved: removedCount,
      totalRuns: prev.totalRuns + 1
    }));

    return removedCount;
  }, []);

  // Auto cleanup on mount and periodically
  useEffect(() => {
    runCleanup();

    const interval = setInterval(() => {
      runCleanup();
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, [runCleanup]);

  return {
    cleanupStats,
    runCleanup
  };
}
