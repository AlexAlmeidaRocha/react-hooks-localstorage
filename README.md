# 🚀 React LocalStorage Hook Library

A complete and powerful React hooks library for managing localStorage with
advanced features like TTL, cross-tab synchronization, caching, validation, and
much more.

[![npm version](https://img.shields.io/npm/v/react-hooks-localstorage)](https://badge.fury.io/js/react-hooks-localstorage)
[![npm downloads](https://img.shields.io/npm/dm/react-hooks-localstorage)](https://www.npmjs.com/package/react-hooks-localstorage)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/react-hooks-localstorage)](https://choosealicense.com/licenses/mit/)

## ✨ Key Features

- 🔄 **Cross-tab synchronization** - Changes automatically reflected across all
  tabs
- ⏰ **TTL (Time To Live)** - Automatic data expiration
- 🔐 **Auto-encryption** - Secure data storage with automatic
  encryption/decryption
- 🎯 **Specialized hooks** - For arrays, objects, booleans, numbers
- 📦 **Smart caching** - For APIs and expensive computations
- 🛠️ **Advanced utilities** - Automatic cleanup, monitoring, backup
- 🎨 **TypeScript** - Fully typed
- 🌐 **SSR Ready** - Compatible with Next.js and other frameworks

## 📦 Installation

```bash
npm install react-hooks-localstorage
```

```bash
yarn add react-hooks-localstorage
```

```bash
pnpm add react-hooks-localstorage
```

## 🚀 Quick Start

### Main Hook

```tsx
import { useLocalStorage } from "react-hooks-localstorage";

function MyComponent() {
  const [name, { setValue, removeValue, isExpired }] = useLocalStorage(
    "user-name",
    "John Doe",
    { ttl: 24 * 60 * 60 * 1000 } // 24 hours
  );

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={removeValue}>Clear</button>
      {isExpired() && <span>⚠️ Data expired!</span>}
    </div>
  );
}
```

### Array Management

```tsx
import { useLocalStorageArray } from "react-hooks-localstorage";

function TodoList() {
  const {
    array: todos,
    addItem,
    removeItem,
    clearArray
  } = useLocalStorageArray("todos", []);

  return (
    <div>
      <button onClick={() => addItem({ id: Date.now(), text: "New task" })}>
        Add
      </button>
      {todos.map((todo, index) => (
        <div key={todo.id}>
          {todo.text}
          <button onClick={() => removeItem(index)}>❌</button>
        </div>
      ))}
    </div>
  );
}
```

### API Caching

```tsx
import { useLocalStorageCache } from "react-hooks-localstorage";

function UserProfile({ userId }) {
  const { data, isLoading, error, refetch } = useLocalStorageCache(
    `user-${userId}`,
    () => fetch(`/api/users/${userId}`).then((res) => res.json()),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000 // 30 minutes
    }
  );

  if (isLoading) return <div>⏳ Loading...</div>;
  if (error) return <div>❌ Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>🔄 Refresh</button>
    </div>
  );
}
```

## 🎯 Available Hooks

### Basic Hooks

- `useLocalStorage` - Main hook with TTL and synchronization
- `useLocalStorageArray` - Array management
- `useLocalStorageObject` - Object management
- `useLocalStorageBoolean` - Boolean management
- `useLocalStorageNumber` - Number management
- `useLocalStorageMultiple` - Multiple keys management

### Advanced Hooks

- `useLocalStorageCache` - Smart caching for APIs
- `useLocalStorageSync` - Cross-component synchronization
- `useLocalStorageCompressed` - Compression for large data
- `useLocalStorageAutoCleanup` - Automatic cleanup

### Utilities

- `LocalStorageManager` - Advanced management
- `localStorageUtils` - Various utilities

## 🔧 Advanced Configuration

```tsx
const options = {
  ttl: 24 * 60 * 60 * 1000, // TTL in milliseconds
  syncAcrossTabs: true, // Cross-tab synchronization
  version: "1.0.0", // Version for migration
  serialize: JSON.stringify, // Custom serialization
  deserialize: JSON.parse, // Custom deserialization

  // 🔐 Encryption options (NEW!)
  autoEncrypt: true, // Enable automatic encryption
  secretKey: "your-secret-key" // Required when autoEncrypt is true
};

const [data, { setValue }] = useLocalStorage("key", defaultValue, options);
```

### 🔒 Encryption Configuration

When `autoEncrypt` is enabled, all data is automatically encrypted before
storing and decrypted when retrieving:

```tsx
// ✅ Secure - data is encrypted
const [secrets, actions] = useLocalStorage(
  "app-secrets",
  { apiKey: "", token: "" },
  {
    autoEncrypt: true,
    secretKey: process.env.REACT_APP_ENCRYPTION_KEY,
    ttl: 30 * 60 * 1000 // 30 minutes for sensitive data
  }
);
```

**Security Notes:**

- The `secretKey` should be stored securely (environment variables recommended)
- Encrypted data has a small performance overhead
- TTL is especially recommended for encrypted sensitive data

## 📱 Practical Examples

### Object Management

```tsx
import { useLocalStorageObject } from "react-hooks-localstorage";

function UserProfile() {
  const {
    object: user,
    setProperty,
    updateObject,
    hasProperty,
    resetObject
  } = useLocalStorageObject("user-profile", {
    name: "",
    email: "",
    age: 0
  });

  return (
    <div>
      <input
        value={user.name}
        onChange={(e) => setProperty("name", e.target.value)}
        placeholder="Name"
      />
      <input
        value={user.email}
        onChange={(e) => setProperty("email", e.target.value)}
        placeholder="Email"
      />
      <button onClick={() => updateObject({ age: user.age + 1 })}>
        Increment Age
      </button>
      <button onClick={resetObject}>Reset</button>
    </div>
  );
}
```

### Boolean Toggle

```tsx
import { useLocalStorageBoolean } from "react-hooks-localstorage";

function ThemeToggle() {
  const {
    value: isDarkMode,
    toggle,
    setTrue,
    setFalse
  } = useLocalStorageBoolean("dark-mode", false);

  return (
    <div>
      <button onClick={toggle}>
        {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      <button onClick={setTrue}>Force Dark</button>
      <button onClick={setFalse}>Force Light</button>
    </div>
  );
}
```

### Number Operations

```tsx
import { useLocalStorageNumber } from "react-hooks-localstorage";

function Counter() {
  const {
    value: count,
    increment,
    decrement,
    multiply,
    divide,
    reset,
    clamp
  } = useLocalStorageNumber("counter", 0);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => increment()}>+1</button>
      <button onClick={() => increment(5)}>+5</button>
      <button onClick={() => decrement()}>-1</button>
      <button onClick={() => multiply(2)}>×2</button>
      <button onClick={() => divide(2)}>÷2</button>
      <button onClick={() => clamp(0, 100)}>Clamp 0-100</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Cross-Component Synchronization

```tsx
import { useLocalStorageSync } from "react-hooks-localstorage";

function ComponentA() {
  const { value, setValue, subscribe } = useLocalStorageSync(
    "shared-data",
    "initial"
  );

  useEffect(() => {
    const unsubscribe = subscribe((newValue) => {
      console.log("Data updated:", newValue);
    });
    return unsubscribe;
  }, [subscribe]);

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

function ComponentB() {
  const { value, setValue } = useLocalStorageSync("shared-data", "initial");

  return <div>Shared value: {value}</div>;
}
```

### 🔐 Encrypted Storage (NEW!)

Store sensitive data with automatic encryption:

```tsx
import { useLocalStorage } from "react-hooks-localstorage";

function SecureComponent() {
  const [sensitiveData, { setValue, removeValue }] = useLocalStorage(
    "user-credentials",
    { username: "", password: "", ssn: "" },
    {
      autoEncrypt: true,
      secretKey: "your-secret-key-here",
      ttl: 15 * 60 * 1000 // 15 minutes for security
    }
  );

  return (
    <div>
      <input
        type="text"
        value={sensitiveData.username}
        onChange={(e) =>
          setValue({
            ...sensitiveData,
            username: e.target.value
          })
        }
        placeholder="Username"
      />
      <input
        type="password"
        value={sensitiveData.password}
        onChange={(e) =>
          setValue({
            ...sensitiveData,
            password: e.target.value
          })
        }
        placeholder="Password"
      />
      <p>✅ Data is automatically encrypted in localStorage!</p>
    </div>
  );
}
```

## 🌐 Compatibility

- **React**: 16.8+ (hooks)
- **TypeScript**: 4.0+
- **Browsers**: All modern browsers
- **SSR**: Next.js, Gatsby, Nuxt.js

## 📄 License

This project is licensed under the MIT License - see the
[LICENSE](https://choosealicense.com/licenses/mit/) file for details.

---

Made with ❤️ by:

[![GitHub](https://img.shields.io/badge/GitHub-@alexalmeidarocha-181717?logo=github&style=for-the-badge)](https://github.com/alexalmeidarocha)  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin&style=for-the-badge)](https://www.linkedin.com/in/alex-almeida-rocha-24049a213/)
