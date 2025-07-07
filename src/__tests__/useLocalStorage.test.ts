/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useLocalStorageArray, useLocalStorageObject } from '../index';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  it('should set value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1].setValue('new value');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringContaining('new value')
    );
  });

  it('should remove value from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1].removeValue();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle TTL expiration', () => {
    const pastTime = Date.now() - 10000; // 10 seconds ago
    const expiredData = JSON.stringify({
      value: 'expired',
      expiresAt: pastTime,
      createdAt: pastTime - 1000,
    });
    
    localStorageMock.getItem.mockReturnValue(expiredData);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial', { ttl: 5000 }));
    
    expect(result.current[0]).toBe('initial');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should work with function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));
    
    act(() => {
      result.current[1].setValue(prev => prev + 5);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringContaining('15')
    );
  });
});

describe('useLocalStorageArray', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useLocalStorageArray('test-array', []));
    
    expect(result.current.array).toEqual([]);
    expect(result.current.length).toBe(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it('should add items to array', () => {
    const { result } = renderHook(() => useLocalStorageArray<string>('test-array', []));
    
    act(() => {
      result.current.addItem('item1');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-array',
      expect.stringContaining('item1')
    );
  });

  it('should remove items from array', () => {
    const initialArray = ['item1', 'item2', 'item3'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      value: initialArray,
      expiresAt: null,
      createdAt: Date.now(),
    }));

    const { result } = renderHook(() => useLocalStorageArray('test-array', []));
    
    act(() => {
      result.current.removeItem(1); // Remove 'item2'
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-array',
      expect.stringContaining('item1')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-array',
      expect.stringContaining('item3')
    );
  });

  it('should update items in array', () => {
    const initialArray = ['item1', 'item2'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      value: initialArray,
      expiresAt: null,
      createdAt: Date.now(),
    }));

    const { result } = renderHook(() => useLocalStorageArray<string>('test-array', []));
    
    act(() => {
      result.current.updateItem(0, 'updated-item1');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-array',
      expect.stringContaining('updated-item1')
    );
  });

  it('should clear array', () => {
    const { result } = renderHook(() => useLocalStorageArray('test-array', ['item1']));
    
    act(() => {
      result.current.clearArray();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-array',
      expect.stringContaining('[]')
    );
  });
});

describe('useLocalStorageObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with default object', () => {
    const defaultObj = { name: 'test', value: 42 };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    expect(result.current.object).toEqual(defaultObj);
    expect(result.current.keys).toEqual(['name', 'value']);
  });

  it('should set property on object', () => {
    const defaultObj = { name: 'test', value: 42 };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    act(() => {
      result.current.setProperty('name', 'new-name');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-obj',
      expect.stringContaining('new-name')
    );
  });

  it('should update object with partial data', () => {
    const defaultObj = { name: 'test', value: 42, active: true };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    act(() => {
      result.current.updateObject({ name: 'updated', value: 100 });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-obj',
      expect.stringContaining('updated')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-obj',
      expect.stringContaining('100')
    );
  });

  it('should remove property from object', () => {
    const defaultObj = { name: 'test', value: 42, temp: 'remove-me' };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    act(() => {
      result.current.removeProperty('temp');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-obj',
      expect.not.stringContaining('remove-me')
    );
  });

  it('should check if property exists', () => {
    const defaultObj = { name: 'test', value: 42 };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    expect(result.current.hasProperty('name')).toBe(true);
    // @ts-ignore - testing non-existent property
    expect(result.current.hasProperty('nonexistent')).toBe(false);
  });

  it('should get property value', () => {
    const defaultObj = { name: 'test', value: 42 };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    expect(result.current.getProperty('name')).toBe('test');
    expect(result.current.getProperty('value')).toBe(42);
  });

  it('should reset object to initial value', () => {
    const defaultObj = { name: 'test', value: 42 };
    const { result } = renderHook(() => useLocalStorageObject('test-obj', defaultObj));
    
    act(() => {
      result.current.setProperty('name', 'changed');
    });

    act(() => {
      result.current.resetObject();
    });

    expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
      'test-obj',
      expect.stringContaining('test')
    );
  });
});

describe('Error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle localStorage quota exceeded error', () => {
    localStorageMock.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1].setValue('new value');
    });

    // Should not throw error, should handle gracefully
    expect(result.current[0]).toBe('initial');
  });

  it('should handle JSON parse errors', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  it('should handle localStorage not available', () => {
    // Mock localStorage as undefined
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
    
    act(() => {
      result.current[1].setValue('new value');
    });

    // Should not throw error when localStorage is not available
    expect(result.current[0]).toBe('new value');
  });
});

describe('SSR compatibility', () => {
  it('should work when window is undefined', () => {
    const originalWindow = (globalThis as any).window;
    delete (globalThis as any).window;

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
    
    act(() => {
      result.current[1].setValue('new value');
    });

    expect(result.current[0]).toBe('new value');

    (globalThis as any).window = originalWindow;
  });
});
