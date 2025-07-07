// Core hook
export { useLocalStorage } from './useLocalStorage';

// Advanced hooks for specific data types
export {
  useLocalStorageArray,
  useLocalStorageObject,
  useLocalStorageBoolean,
  useLocalStorageNumber,
  useLocalStorageMultiple,
} from './useLocalStorageAdvanced';

// Specialized hooks for specific use cases
export {
  useLocalStorageCache,
  useLocalStorageSync,
  useLocalStorageCompressed,
  useLocalStorageAutoCleanup,
} from './useLocalStorageSpecialized';

// Utilities and manager
export {
  LocalStorageManager,
  localStorageManager,
  localStorageUtils,
} from './localStorage.utils';

// Types
export type {
  ExpiringLocalStorageValue,
  LocalStorageOptions,
  UseLocalStorageReturn,
  LocalStorageEventDetail,
  LocalStorageError,
  LocalStorageManagerOptions,
} from './localStorage.types';
