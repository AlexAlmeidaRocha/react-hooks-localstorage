import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { LocalStorageOptions } from './localStorage.types';
import { localStorageManager } from './localStorage.utils';

/**
 * Hook for managing arrays in localStorage with array-specific methods
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = [],
  options: LocalStorageOptions = {},
) {
  const [array, { setValue, removeValue, refreshValue, ...methods }] =
    useLocalStorage<T[]>(key, initialValue, options);

  const addItem = useCallback(
    (item: T) => {
      setValue((prev) => [...prev, item]);
    },
    [setValue],
  );

  const removeItem = useCallback(
    (index: number) => {
      setValue((prev) => prev.filter((_, i) => i !== index));
    },
    [setValue],
  );

  const removeItemByValue = useCallback(
    (item: T) => {
      setValue((prev) => prev.filter((i) => i !== item));
    },
    [setValue],
  );

  const updateItem = useCallback(
    (index: number, newItem: T) => {
      setValue((prev) => prev.map((item, i) => (i === index ? newItem : item)));
    },
    [setValue],
  );

  const insertItem = useCallback(
    (index: number, item: T) => {
      setValue((prev) => [...prev.slice(0, index), item, ...prev.slice(index)]);
    },
    [setValue],
  );

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      setValue((prev) => {
        const newArray = [...prev];
        const item = newArray.splice(fromIndex, 1)[0];
        newArray.splice(toIndex, 0, item);
        return newArray;
      });
    },
    [setValue],
  );

  const clearArray = useCallback(() => {
    setValue([]);
  }, [setValue]);

  const findItem = useCallback(
    (predicate: (item: T) => boolean): T | undefined => {
      return array.find(predicate);
    },
    [array],
  );

  const findIndex = useCallback(
    (predicate: (item: T) => boolean): number => {
      return array.findIndex(predicate);
    },
    [array],
  );

  return {
    array,
    setArray: setValue,
    addItem,
    removeItem,
    removeItemByValue,
    updateItem,
    insertItem,
    moveItem,
    clearArray,
    findItem,
    findIndex,
    length: array.length,
    isEmpty: array.length === 0,
    removeValue,
    refreshValue,
    ...methods,
  };
}

/**
 * Hook for managing objects in localStorage with object-specific methods
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {},
) {
  const [object, { setValue, removeValue, refreshValue, ...methods }] =
    useLocalStorage<T>(key, initialValue, options);

  const setProperty = useCallback(
    <K extends keyof T>(property: K, value: T[K]) => {
      setValue((prev) => ({ ...prev, [property]: value }));
    },
    [setValue],
  );

  const removeProperty = useCallback(
    <K extends keyof T>(property: K) => {
      setValue((prev) => {
        const newObj = { ...prev };
        delete newObj[property];
        return newObj;
      });
    },
    [setValue],
  );

  const updateObject = useCallback(
    (updates: Partial<T>) => {
      setValue((prev) => ({ ...prev, ...updates }));
    },
    [setValue],
  );

  const resetObject = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  const hasProperty = useCallback(
    <K extends keyof T>(property: K): boolean => {
      return property in object;
    },
    [object],
  );

  const getProperty = useCallback(
    <K extends keyof T>(property: K): T[K] => {
      return object[property];
    },
    [object],
  );

  return {
    object,
    setObject: setValue,
    setProperty,
    removeProperty,
    updateObject,
    resetObject,
    hasProperty,
    getProperty,
    keys: Object.keys(object) as Array<keyof T>,
    values: Object.values(object),
    entries: Object.entries(object) as Array<[keyof T, T[keyof T]]>,
    removeValue,
    refreshValue,
    ...methods,
  };
}

/**
 * Hook for managing boolean states in localStorage (like toggles, flags)
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false,
  options: LocalStorageOptions = {},
) {
  const [value, { setValue, removeValue, refreshValue, ...methods }] =
    useLocalStorage<boolean>(key, initialValue, options);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, [setValue]);

  const setTrue = useCallback(() => {
    setValue(true);
  }, [setValue]);

  const setFalse = useCallback(() => {
    setValue(false);
  }, [setValue]);

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
    removeValue,
    refreshValue,
    ...methods,
  };
}

/**
 * Hook for managing numeric values in localStorage with numeric operations
 */
export function useLocalStorageNumber(
  key: string,
  initialValue: number = 0,
  options: LocalStorageOptions = {},
) {
  const [value, { setValue, removeValue, refreshValue, ...methods }] =
    useLocalStorage<number>(key, initialValue, options);

  const increment = useCallback(
    (step: number = 1) => {
      setValue((prev) => prev + step);
    },
    [setValue],
  );

  const decrement = useCallback(
    (step: number = 1) => {
      setValue((prev) => prev - step);
    },
    [setValue],
  );

  const multiply = useCallback(
    (factor: number) => {
      setValue((prev) => prev * factor);
    },
    [setValue],
  );

  const divide = useCallback(
    (divisor: number) => {
      setValue((prev) => (divisor !== 0 ? prev / divisor : prev));
    },
    [setValue],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  const setMin = useCallback(
    (min: number) => {
      setValue((prev) => Math.max(prev, min));
    },
    [setValue],
  );

  const setMax = useCallback(
    (max: number) => {
      setValue((prev) => Math.min(prev, max));
    },
    [setValue],
  );

  const clamp = useCallback(
    (min: number, max: number) => {
      setValue((prev) => Math.max(min, Math.min(max, prev)));
    },
    [setValue],
  );

  return {
    value,
    setValue,
    increment,
    decrement,
    multiply,
    divide,
    reset,
    setMin,
    setMax,
    clamp,
    removeValue,
    refreshValue,
    ...methods,
  };
}

/**
 * Hook for managing multiple localStorage keys as a single state
 */
export function useLocalStorageMultiple<T extends Record<string, any>>(
  keys: T,
  options: LocalStorageOptions = {},
) {
  const [values, setValuesState] = useState<T>(() => {
    const initialValues = {} as T;

    for (const [key, initialValue] of Object.entries(keys)) {
      initialValues[key as keyof T] =
        localStorageManager.getItem(key, options) ?? initialValue;
    }

    return initialValues;
  });

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValuesState((prev) => ({ ...prev, [key]: value }));
      localStorageManager.setItem(key as string, value, options);
    },
    [options],
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState((prev) => ({ ...prev, ...newValues }));

      for (const [key, value] of Object.entries(newValues)) {
        localStorageManager.setItem(key, value, options);
      }
    },
    [options],
  );

  const removeValue = useCallback(
    <K extends keyof T>(key: K) => {
      setValuesState((prev) => ({ ...prev, [key]: keys[key] }));
      localStorageManager.removeItem(key as string);
    },
    [keys],
  );

  const removeAll = useCallback(() => {
    setValuesState(keys);

    for (const key of Object.keys(keys)) {
      localStorageManager.removeItem(key);
    }
  }, [keys]);

  const refreshValues = useCallback(() => {
    const newValues = {} as T;

    for (const [key, initialValue] of Object.entries(keys)) {
      newValues[key as keyof T] =
        localStorageManager.getItem(key, options) ?? initialValue;
    }

    setValuesState(newValues);
  }, [keys, options]);

  return {
    values,
    setValue,
    setValues,
    removeValue,
    removeAll,
    refreshValues,
  };
}
