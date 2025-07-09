export { useLocalStorage } from "./useLocalStorage";

export {
  useLocalStorageArray,
  useLocalStorageObject,
  useLocalStorageBoolean,
  useLocalStorageNumber,
  useLocalStorageMultiple
} from "./useLocalStorageAdvanced";

export {
  useLocalStorageCache,
  useLocalStorageSync,
  useLocalStorageCompressed,
  useLocalStorageAutoCleanup
} from "./useLocalStorageSpecialized";

export {
  LocalStorageManager,
  localStorageManager,
  localStorageUtils
} from "./localStorage.utils";

export type {
  ExpiringLocalStorageValue,
  LocalStorageOptions,
  UseLocalStorageReturn,
  LocalStorageEventDetail,
  LocalStorageError,
  LocalStorageManagerOptions
} from "./localStorage.types";
