import { useCallback, useEffect, useRef, useState } from "react";

import {
  LocalStorageEventDetail,
  LocalStorageOptions,
  UseLocalStorageReturn
} from "./localStorage.types";
import { localStorageManager } from "./localStorage.utils";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
): UseLocalStorageReturn<T> {
  const isBrowser = typeof window !== "undefined";
  const optionsRef = useRef(options);
  const [, setError] = useState<Error | null>(null);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const readValue = useCallback((): T => {
    if (!isBrowser) return initialValue;

    try {
      const value = localStorageManager.getItem<T>(key, optionsRef.current);

      return value !== null ? value : initialValue;
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to read from localStorage")
      );

      return initialValue;
    }
  }, [key, initialValue, isBrowser]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        setError(null);
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Try to persist to localStorage
        const result = localStorageManager.setItem(
          key,
          valueToStore,
          optionsRef.current
        );

        if (result === "unavailable") {
          // localStorage is not available (SSR, undefined, etc.)
          // Update state anyway - it should work like a regular useState
          setStoredValue(valueToStore);
        } else if (result === true) {
          // Successfully saved to localStorage
          setStoredValue(valueToStore);
        } else {
          // Failed to save (quota exceeded, etc.)
          // Don't update state to maintain consistency
          throw new Error("Failed to save to localStorage");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to save to localStorage")
        );
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setError(null);
      localStorageManager.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to remove from localStorage")
      );
    }
  }, [key, initialValue]);

  const refreshValue = useCallback(() => {
    if (!isBrowser) return;

    try {
      const value = localStorageManager.getItem<T>(key, optionsRef.current);
      const newValue = value !== null ? value : initialValue;
      setStoredValue(newValue);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to read from localStorage")
      );
    }
  }, [key, initialValue, isBrowser]);

  const isExpired = useCallback((): boolean => {
    const metadata = localStorageManager.getItemMetadata(key);
    if (!metadata || !metadata.expiresAt) return false;

    return Date.now() > metadata.expiresAt;
  }, [key]);

  const getCreatedAt = useCallback((): number | null => {
    const metadata = localStorageManager.getItemMetadata(key);

    return metadata?.createdAt || null;
  }, [key]);

  const getExpiresAt = useCallback((): number | null => {
    const metadata = localStorageManager.getItemMetadata(key);

    return metadata?.expiresAt || null;
  }, [key]);

  const getRemainingTime = useCallback((): number | null => {
    const metadata = localStorageManager.getItemMetadata(key);
    if (!metadata || !metadata.expiresAt) return null;

    const remaining = metadata.expiresAt - Date.now();

    return remaining > 0 ? remaining : 0;
  }, [key]);

  // Listen for storage changes (including from other tabs)
  useEffect(() => {
    if (!isBrowser) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== e.oldValue) {
        refreshValue();
      }
    };

    const handleCustomStorageChange = (
      e: CustomEvent<LocalStorageEventDetail<T>>
    ) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, [key, isBrowser]);

  // Auto-refresh when key changes
  useEffect(() => {
    refreshValue();
  }, [key]);

  // Auto-cleanup expired items (optional)
  useEffect(() => {
    if (!isBrowser || !options.ttl) return;

    const interval = setInterval(
      () => {
        // Check if expired directly without using callback
        const metadata = localStorageManager.getItemMetadata(key);
        const expired = metadata?.expiresAt && Date.now() > metadata.expiresAt;

        if (expired) {
          try {
            localStorageManager.removeItem(key);
            setStoredValue(initialValue);
          } catch (err) {
            setError(
              err instanceof Error
                ? err
                : new Error("Failed to remove expired item")
            );
          }
        }
      },
      Math.min(options.ttl / 10, 60000)
    ); // Check every 1/10 of TTL or max 1 minute

    return () => clearInterval(interval);
  }, [options.ttl, key, initialValue, isBrowser]);

  return [
    storedValue,
    {
      setValue,
      removeValue,
      refreshValue,
      isExpired,
      getCreatedAt,
      getExpiresAt,
      getRemainingTime
    }
  ];
}
