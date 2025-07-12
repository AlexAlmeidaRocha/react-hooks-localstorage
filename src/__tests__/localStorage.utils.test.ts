/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment jsdom
 */

import { LocalStorageManager, localStorageUtils } from "../localStorage.utils";

describe("LocalStorageManager", () => {
  let manager: LocalStorageManager;
  let mockOnError: jest.Mock;

  // Create a more complete localStorage mock
  const createLocalStorageMock = () => {
    const storage: Record<string, string> = {};

    return {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      }),
      key: jest.fn((index: number) => {
        const keys = Object.keys(storage);

        return keys[index] || null;
      }),
      get length() {
        return Object.keys(storage).length;
      },
      hasOwnProperty: jest.fn((key: string) => key in storage),
      // Internal storage for testing
      __storage: storage
    };
  };

  beforeEach(() => {
    const localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true
    });

    mockOnError = jest.fn();
    manager = new LocalStorageManager({
      prefix: "test",
      version: "1.0.0",
      onError: mockOnError
    });

    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const defaultManager = new LocalStorageManager();
      expect(defaultManager).toBeDefined();
    });

    it("should create instance with custom options", () => {
      const customManager = new LocalStorageManager({
        prefix: "custom",
        version: "2.0.0",
        onError: mockOnError
      });
      expect(customManager).toBeDefined();
    });
  });

  describe("setItem", () => {
    it("should store item successfully", () => {
      const result = manager.setItem("testKey", "testValue", {});

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "test:testKey",
        expect.stringContaining("testValue")
      );
    });

    it("should store item with TTL", () => {
      const ttl = 1000;
      const result = manager.setItem("testKey", "testValue", { ttl });

      expect(result).toBe(true);
      const storedData = JSON.parse(
        (window.localStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(storedData.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should return 'unavailable' when localStorage is not available", () => {
      // @ts-expect-error - Testing missing localStorage
      delete window.localStorage;

      const result = manager.setItem("testKey", "testValue", {});
      expect(result).toBe("unavailable");
    });

    it("should handle serialization errors", () => {
      const circularObj: { self?: unknown } = { self: null };
      circularObj.self = circularObj;

      const result = manager.setItem("testKey", circularObj, {});

      expect(result).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SERIALIZATION_ERROR",
          message: expect.any(String)
        })
      );
    });
  });

  describe("getItem", () => {
    beforeEach(() => {
      // Setup a valid item in localStorage
      const data = {
        value: "testValue",
        expiresAt: null,
        createdAt: Date.now(),
        version: "1.0.0"
      };
      window.localStorage.__storage["test:testKey"] = JSON.stringify(data);
    });

    it("should retrieve item successfully", () => {
      const result = manager.getItem("testKey");
      expect(result).toBe("testValue");
    });

    it("should return null for non-existent item", () => {
      const result = manager.getItem("nonExistent");
      expect(result).toBeNull();
    });

    it("should return null and remove expired item", () => {
      const expiredData = {
        value: "expiredValue",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        createdAt: Date.now() - 2000,
        version: "1.0.0"
      };
      window.localStorage.__storage["test:expiredKey"] =
        JSON.stringify(expiredData);

      const result = manager.getItem("expiredKey");

      expect(result).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        "test:expiredKey"
      );
    });

    it("should handle deserialization errors", () => {
      window.localStorage.__storage["test:corruptKey"] = "invalid json";

      const result = manager.getItem("corruptKey");

      expect(result).toBeNull();
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DESERIALIZATION_ERROR"
        })
      );
    });
  });

  describe("removeItem", () => {
    it("should remove item successfully", () => {
      manager.removeItem("testKey");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        "test:testKey"
      );
    });
  });

  describe("hasItem", () => {
    it("should return true for existing non-expired item", () => {
      const data = {
        value: "testValue",
        expiresAt: null,
        createdAt: Date.now(),
        version: "1.0.0"
      };
      window.localStorage.__storage["test:testKey"] = JSON.stringify(data);

      const result = manager.hasItem("testKey");
      expect(result).toBe(true);
    });

    it("should return false for non-existent item", () => {
      const result = manager.hasItem("nonExistent");
      expect(result).toBe(false);
    });

    it("should return false for expired item", () => {
      const expiredData = {
        value: "expiredValue",
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 2000,
        version: "1.0.0"
      };
      window.localStorage.__storage["test:expiredKey"] =
        JSON.stringify(expiredData);

      const result = manager.hasItem("expiredKey");
      expect(result).toBe(false);
    });
  });

  describe("getItemMetadata", () => {
    it("should return metadata for existing item", () => {
      const createdAt = Date.now();
      const expiresAt = Date.now() + 1000;
      const data = {
        value: "testValue",
        expiresAt,
        createdAt,
        version: "1.0.0"
      };
      window.localStorage.__storage["test:testKey"] = JSON.stringify(data);

      const result = manager.getItemMetadata("testKey");

      expect(result).toEqual({
        createdAt,
        expiresAt,
        version: "1.0.0"
      });
    });

    it("should return null for non-existent item", () => {
      const result = manager.getItemMetadata("nonExistent");
      expect(result).toBeNull();
    });
  });

  describe("getAllKeys", () => {
    it("should call Object.keys with localStorage", () => {
      const spy = jest.spyOn(Object, "keys");
      manager.getAllKeys();
      expect(spy).toHaveBeenCalledWith(window.localStorage);
      spy.mockRestore();
    });
  });

  describe("clear", () => {
    it("should attempt to clear items", () => {
      // Just verify the method runs without errors
      expect(() => manager.clear()).not.toThrow();
    });
  });

  describe("getStorageInfo", () => {
    it("should return storage usage information", () => {
      window.localStorage.__storage = {
        key1: "value1",
        key2: "value2longer"
      };

      const info = manager.getStorageInfo();

      expect(info).toEqual({
        used: expect.any(Number),
        remaining: expect.any(Number),
        total: 5 * 1024 * 1024 // 5MB
      });
      expect(info.used).toBeGreaterThan(0);
      expect(info.remaining).toBeLessThan(info.total);
    });
  });

  describe("cleanupExpiredItems", () => {
    it("should run without errors", () => {
      // Just verify the method runs without errors
      expect(() => manager.cleanupExpiredItems()).not.toThrow();
    });

    it("should return a number", () => {
      const result = manager.cleanupExpiredItems();
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("localStorageUtils", () => {
  beforeEach(() => {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true
    });

    jest.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("should return true when localStorage is available", () => {
      const result = localStorageUtils.isAvailable();
      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "__localStorage_test__",
        "test"
      );
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        "__localStorage_test__"
      );
    });

    it("should return false when localStorage throws error", () => {
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const result = localStorageUtils.isAvailable();
      expect(result).toBe(false);
    });

    it("should return false in non-browser environment", () => {
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true
      });

      const result = localStorageUtils.isAvailable();
      expect(result).toBe(false);

      // Restore localStorage
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true
      });
    });
  });

  describe("getItemSize", () => {
    it("should return correct size for existing item", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue("testValue");

      const size = localStorageUtils.getItemSize("testKey");

      expect(size).toBe("testValue".length + "testKey".length);
      expect(window.localStorage.getItem).toHaveBeenCalledWith("testKey");
    });

    it("should return 0 for non-existent item", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const size = localStorageUtils.getItemSize("nonExistent");
      expect(size).toBe(0);
    });
  });

  describe("exportData", () => {
    it("should export localStorage data as JSON", () => {
      (window.localStorage as any).length = 2;
      (window.localStorage.key as jest.Mock)
        .mockReturnValueOnce("key1")
        .mockReturnValueOnce("key2")
        .mockReturnValueOnce(null);
      (window.localStorage.getItem as jest.Mock)
        .mockReturnValueOnce("value1")
        .mockReturnValueOnce("value2");

      const exported = localStorageUtils.exportData();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual({
        key1: "value1",
        key2: "value2"
      });
    });

    it("should return empty object when localStorage is empty", () => {
      (window.localStorage as any).length = 0;

      const exported = localStorageUtils.exportData();
      expect(exported).toBe("{}");
    });
  });

  describe("importData", () => {
    it("should import data successfully", () => {
      const jsonData = JSON.stringify({
        key1: "value1",
        key2: "value2"
      });

      const result = localStorageUtils.importData(jsonData);

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "key1",
        "value1"
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "key2",
        "value2"
      );
    });

    it("should return false for invalid JSON", () => {
      const result = localStorageUtils.importData("invalid json");
      expect(result).toBe(false);
    });

    it("should skip non-string values", () => {
      const jsonData = JSON.stringify({
        key1: "value1",
        key2: 123, // number, should be skipped
        key3: "value3"
      });

      const result = localStorageUtils.importData(jsonData);

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "key1",
        "value1"
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "key3",
        "value3"
      );
      expect(window.localStorage.setItem).not.toHaveBeenCalledWith("key2", 123);
    });
  });
});
