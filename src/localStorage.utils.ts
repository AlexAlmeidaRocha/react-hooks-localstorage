/* eslint-disable no-console */
import * as CryptoJS from "crypto-js";

import {
  ExpiringLocalStorageValue,
  LocalStorageError,
  LocalStorageOptions
} from "./localStorage.types";

/**
 * Utility class for advanced localStorage operations
 */
export class LocalStorageManager {
  private prefix: string;
  private version: string;
  private onError?: (error: LocalStorageError) => void;

  constructor(
    options: {
      prefix?: string;
      version?: string;
      onError?: (error: LocalStorageError) => void;
    } = {}
  ) {
    this.prefix = options.prefix || "";
    this.version = options.version || "1.0.0";
    this.onError = options.onError;
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  private handleError(error: LocalStorageError): void {
    if (this.onError) {
      this.onError(error);
    } else {
      console.warn("LocalStorage Error:", error);
    }
  }

  private defaultSerialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  private defaultDeserialize(value: string): unknown {
    return JSON.parse(value);
  }

  private encrypt<T>(data: T, secretKey: string): string {
    const stringified = JSON.stringify(data);

    return CryptoJS.AES.encrypt(stringified, secretKey).toString();
  }

  private decrypt<T>(cipher: string, secretKey: string): T {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error}`);
    }
  }

  /**
   * Set a value in localStorage with optional TTL
   */
  setItem<T>(
    key: string,
    value: T,
    options: LocalStorageOptions<T>
  ): boolean | "unavailable" {
    if (typeof window === "undefined" || !window.localStorage)
      return "unavailable";

    try {
      const expiresAt = options.ttl ? Date.now() + options.ttl : null;

      const dataToStore: ExpiringLocalStorageValue<T> = {
        value,
        expiresAt,
        createdAt: Date.now(),
        version: options.version || this.version
      };

      let serializedData: string;

      if (options.autoEncrypt && options.secretKey) {
        // Use encryption - serialize the data and then encrypt it
        const serializedForEncryption = options.serialize
          ? options.serialize(dataToStore as T)
          : this.defaultSerialize(dataToStore);
        serializedData = this.encrypt(
          serializedForEncryption,
          options.secretKey
        );
      } else {
        // Use normal serialization
        const serialize = options.serialize || this.defaultSerialize;
        serializedData = serialize(dataToStore as T);
      }

      window.localStorage.setItem(this.getKey(key), serializedData);

      // Dispatch custom event for cross-tab synchronization
      if (options.syncAcrossTabs !== false) {
        this.dispatchStorageEvent(key, value, this.getItem(key));
      }

      return true;
    } catch (error) {
      const localStorageError: LocalStorageError = {
        type:
          error instanceof Error && error.name === "QuotaExceededError"
            ? "QUOTA_EXCEEDED"
            : "SERIALIZATION_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        originalError: error instanceof Error ? error : undefined
      };

      this.handleError(localStorageError);

      return false;
    }
  }

  /**
   * Get a value from localStorage with expiration check
   */
  getItem<T>(
    key: string,
    options: LocalStorageOptions<T> = {} as LocalStorageOptions<T>
  ): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = window.localStorage.getItem(this.getKey(key));
      if (!item) return null;

      let data: ExpiringLocalStorageValue<T>;

      if (options.autoEncrypt && options.secretKey) {
        // Decrypt the data first, then deserialize
        const decryptedData = this.decrypt(item, options.secretKey);
        data = options.deserialize
          ? (options.deserialize(
              decryptedData as string
            ) as ExpiringLocalStorageValue<T>)
          : (this.defaultDeserialize(
              decryptedData as string
            ) as ExpiringLocalStorageValue<T>);
      } else {
        // Use normal deserialization
        const deserialize = options.deserialize || this.defaultDeserialize;
        data = deserialize(item as string) as ExpiringLocalStorageValue<T>;
      }

      // Check if item has expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.removeItem(key);

        return null;
      }

      return data.value;
    } catch (error) {
      const localStorageError: LocalStorageError = {
        type: "DESERIALIZATION_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to deserialize data",
        originalError: error instanceof Error ? error : undefined
      };

      this.handleError(localStorageError);

      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(this.getKey(key));
    } catch (error) {
      const localStorageError: LocalStorageError = {
        type: "UNKNOWN_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to remove item",
        originalError: error instanceof Error ? error : undefined
      };

      this.handleError(localStorageError);
    }
  }

  /**
   * Check if an item exists and is not expired
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get metadata about a stored item
   */
  getItemMetadata(
    key: string
  ): { createdAt: number; expiresAt: number | null; version?: string } | null {
    if (typeof window === "undefined") return null;

    try {
      const item = window.localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const data: ExpiringLocalStorageValue<unknown> = JSON.parse(item);

      return {
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        version: data.version
      };
    } catch {
      return null;
    }
  }

  /**
   * Clear all items with the current prefix
   */
  clear(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(window.localStorage);
      const prefix = this.prefix ? `${this.prefix}:` : "";

      keys.forEach((key) => {
        if (key.startsWith(prefix)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      const localStorageError: LocalStorageError = {
        type: "UNKNOWN_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to clear storage",
        originalError: error instanceof Error ? error : undefined
      };

      this.handleError(localStorageError);
    }
  }

  /**
   * Get all keys with the current prefix
   */
  getAllKeys(): string[] {
    if (typeof window === "undefined") return [];

    try {
      const keys = Object.keys(window.localStorage);
      const prefix = this.prefix ? `${this.prefix}:` : "";

      return keys
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.replace(prefix, ""));
    } catch {
      return [];
    }
  }

  /**
   * Get localStorage usage information
   */
  getStorageInfo(): { used: number; remaining: number; total: number } {
    if (typeof window === "undefined") {
      return { used: 0, remaining: 0, total: 0 };
    }

    try {
      const total = 5 * 1024 * 1024; // 5MB typical limit
      let used = 0;

      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          used += window.localStorage[key].length + key.length;
        }
      }

      return {
        used,
        remaining: total - used,
        total
      };
    } catch {
      return { used: 0, remaining: 0, total: 0 };
    }
  }

  /**
   * Clean up expired items
   */
  cleanupExpiredItems(): number {
    if (typeof window === "undefined") return 0;

    let cleanedCount = 0;
    const keys = this.getAllKeys();

    keys.forEach((key) => {
      try {
        const rawItem = window.localStorage.getItem(this.getKey(key));
        if (!rawItem) return;

        const data = JSON.parse(rawItem) as ExpiringLocalStorageValue<unknown>;

        // Check if item has expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
          this.removeItem(key);
          cleanedCount++;
        }
      } catch {
        // If we can't parse the item, it's corrupted, so remove it
        this.removeItem(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  private dispatchStorageEvent<T>(key: string, newValue: T, oldValue: T): void {
    if (typeof window === "undefined") return;

    const event = new CustomEvent("localStorageChange", {
      detail: { key, newValue, oldValue }
    });

    window.dispatchEvent(event);
  }
}

// Default instance
export const localStorageManager = new LocalStorageManager();

// Utility functions
export const localStorageUtils = {
  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    if (typeof window === "undefined") return false;

    try {
      const test = "__localStorage_test__";
      window.localStorage.setItem(test, "test");
      window.localStorage.removeItem(test);

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get size of a specific item in bytes
   */
  getItemSize(key: string): number {
    if (typeof window === "undefined") return 0;

    try {
      const item = window.localStorage.getItem(key);

      return item ? item.length + key.length : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Backup localStorage to a JSON string
   */
  exportData(): string {
    if (typeof window === "undefined") return "{}";

    try {
      const data: Record<string, string> = {};

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);

        if (key) {
          data[key] = window.localStorage.getItem(key) || "";
        }
      }

      return JSON.stringify(data, null, 2);
    } catch {
      return "{}";
    }
  },

  /**
   * Restore localStorage from a JSON string
   */
  importData(jsonData: string): boolean {
    if (typeof window === "undefined") return false;

    try {
      const data = JSON.parse(jsonData);

      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "string") {
          window.localStorage.setItem(key, value);
        }
      });

      return true;
    } catch {
      return false;
    }
  }
};
