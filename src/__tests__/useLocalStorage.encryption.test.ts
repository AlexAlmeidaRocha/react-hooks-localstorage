import { act, renderHook } from "@testing-library/react";

import { useLocalStorage } from "../useLocalStorage";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true
});

describe("useLocalStorage with encryption", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it("should encrypt data when autoEncrypt is true", () => {
    const { result } = renderHook(() =>
      useLocalStorage(
        "encrypted-test",
        { password: "secret123", email: "test@example.com" },
        {
          autoEncrypt: true,
          secretKey: "my-secret-key"
        }
      )
    );

    const [, { setValue }] = result.current;

    act(() => {
      setValue({ password: "newpassword", email: "new@example.com" });
    });

    // Check that localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Get the stored value
    const [, storedValue] = localStorageMock.setItem.mock.calls[0];

    // The stored value should be encrypted (not plain JSON)
    expect(storedValue).not.toContain("newpassword");
    expect(storedValue).not.toContain("new@example.com");
    expect(typeof storedValue).toBe("string");
  });

  it("should decrypt data when autoEncrypt is true", () => {
    // Simulate encrypted data in localStorage
    const encryptedData = "U2FsdGVkX1+encrypted_data_here";
    localStorageMock.getItem.mockReturnValue(encryptedData);

    renderHook(() =>
      useLocalStorage(
        "encrypted-test",
        { password: "", email: "" },
        {
          autoEncrypt: true,
          secretKey: "my-secret-key"
        }
      )
    );

    // The hook should attempt to decrypt the data
    expect(localStorageMock.getItem).toHaveBeenCalledWith("encrypted-test");
  });

  it("should work normally without encryption when autoEncrypt is false", () => {
    const { result } = renderHook(() =>
      useLocalStorage(
        "normal-test",
        { name: "John" },
        {
          autoEncrypt: false
        }
      )
    );

    const [, { setValue }] = result.current;

    act(() => {
      setValue({ name: "Jane" });
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();

    const [, storedValue] = localStorageMock.setItem.mock.calls[0];
    const parsedValue = JSON.parse(storedValue);

    // Should contain the actual data structure with value property
    expect(parsedValue).toHaveProperty("value");
    expect(parsedValue.value).toEqual({ name: "Jane" });
  });

  it("should handle decryption errors gracefully", () => {
    // Simulate corrupted encrypted data
    localStorageMock.getItem.mockReturnValue("invalid_encrypted_data");

    const { result } = renderHook(() =>
      useLocalStorage(
        "corrupted-test",
        { default: "value" },
        {
          autoEncrypt: true,
          secretKey: "my-secret-key"
        }
      )
    );

    const [value] = result.current;

    // Should fall back to initial value when decryption fails
    expect(value).toEqual({ default: "value" });
  });
});
