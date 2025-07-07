export type ExpiringLocalStorageValue<T> = {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  version?: string;
};

export type LocalStorageOptions = {
  ttl?: number; // Time to live in milliseconds
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  syncAcrossTabs?: boolean;
  version?: string; // For data migration
};

export type UseLocalStorageReturn<T> = [
  T,
  {
    setValue: (value: T | ((prevValue: T) => T)) => void;
    removeValue: () => void;
    refreshValue: () => void;
    isExpired: () => boolean;
    getCreatedAt: () => number | null;
    getExpiresAt: () => number | null;
    getRemainingTime: () => number | null;
  }
];

export type LocalStorageEventDetail<T> = {
  key: string;
  newValue: T;
  oldValue: T;
};

export type LocalStorageError = {
  type: 'QUOTA_EXCEEDED' | 'SERIALIZATION_ERROR' | 'DESERIALIZATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: Error;
};

export type LocalStorageManagerOptions = {
  prefix?: string;
  version?: string;
  onError?: (error: LocalStorageError) => void;
};
