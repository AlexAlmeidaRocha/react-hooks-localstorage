import React from 'react';
import {
  useLocalStorage,
  useLocalStorageArray,
  useLocalStorageObject,
  useLocalStorageBoolean,
  useLocalStorageNumber,
  useLocalStorageCache,
  localStorageUtils,
  localStorageManager,
} from '../src/index';

// Example 1: Basic usage with TTL
export function BasicExample() {
  const [name, { setValue, removeValue, isExpired, getRemainingTime }] =
    useLocalStorage(
      'user-name',
      'João Silva',
      { ttl: 60000 }, // 1 minute
    );

  const remainingTime = getRemainingTime();

  return (
    <div className="example-container">
      <h2>Basic LocalStorage Hook</h2>
      <div>
        <input
          value={name}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite seu nome"
        />
        <button onClick={removeValue}>Limpar</button>
      </div>
      <div className="info">
        <p>Nome atual: {name}</p>
        <p>Expirado: {isExpired() ? 'Sim' : 'Não'}</p>
        {remainingTime && (
          <p>Tempo restante: {Math.round(remainingTime / 1000)}s</p>
        )}
      </div>
    </div>
  );
}

// Example 2: Array management
export function ArrayExample() {
  type Task = {
    id: number;
    text: string;
    completed: boolean;
    createdAt: string;
  };

  const {
    array: tasks,
    addItem,
    removeItem,
    updateItem,
    clearArray,
    length,
    isEmpty,
  } = useLocalStorageArray<Task>('task-list', []);

  const addTask = () => {
    const newTask = {
      id: Date.now(),
      text: `Tarefa ${length + 1}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    addItem(newTask);
  };

  const toggleTask = (index: number) => {
    const task = tasks[index];
    updateItem(index, { ...task, completed: !task.completed });
  };

  return (
    <div className="example-container">
      <h2>Array Management</h2>
      <div className="controls">
        <button onClick={addTask}>Adicionar Tarefa</button>
        <button onClick={clearArray} disabled={isEmpty}>
          Limpar Todas
        </button>
      </div>
      <div className="info">
        <p>Total de tarefas: {length}</p>
        <p>Lista vazia: {isEmpty ? 'Sim' : 'Não'}</p>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`task ${task.completed ? 'completed' : ''}`}
          >
            <span>{task.text}</span>
            <button onClick={() => toggleTask(index)}>
              {task.completed ? 'Desmarcar' : 'Completar'}
            </button>
            <button onClick={() => removeItem(index)}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 3: Object management
export function ObjectExample() {
  const {
    object: userProfile,
    setProperty,
    updateObject,
    resetObject,
    hasProperty,
    keys,
  } = useLocalStorageObject('user-profile', {
    name: '',
    email: '',
    age: 0,
    preferences: {
      theme: 'light',
      notifications: true,
    },
  });

  const incrementAge = () => {
    setProperty('age', userProfile.age + 1);
  };

  const toggleTheme = () => {
    const newTheme =
      userProfile.preferences.theme === 'light' ? 'dark' : 'light';
    updateObject({
      preferences: {
        ...userProfile.preferences,
        theme: newTheme,
      },
    });
  };

  return (
    <div className="example-container">
      <h2>Object Management</h2>
      <div className="form">
        <input
          value={userProfile.name}
          onChange={(e) => setProperty('name', e.target.value)}
          placeholder="Nome"
        />
        <input
          value={userProfile.email}
          onChange={(e) => setProperty('email', e.target.value)}
          placeholder="Email"
        />
        <div>
          <span>Idade: {userProfile.age}</span>
          <button onClick={incrementAge}>+1</button>
        </div>
        <div>
          <span>Tema: {userProfile.preferences.theme}</span>
          <button onClick={toggleTheme}>Alternar</button>
        </div>
        <button onClick={resetObject}>Resetar Perfil</button>
      </div>
      <div className="info">
        <p>Propriedades: {keys.join(', ')}</p>
        <p>Tem email: {hasProperty('email') ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  );
}

// Example 4: Boolean toggle
export function BooleanExample() {
  const {
    value: isDarkMode,
    toggle,
    setTrue,
    setFalse,
  } = useLocalStorageBoolean('dark-mode', false);

  const { value: isNotificationsEnabled, toggle: toggleNotifications } =
    useLocalStorageBoolean('notifications', true);

  return (
    <div className="example-container">
      <h2>Boolean Management</h2>
      <div className="toggles">
        <div>
          <label>
            <input type="checkbox" checked={isDarkMode} onChange={toggle} />
            Modo Escuro
          </label>
          <button onClick={setTrue}>Ativar</button>
          <button onClick={setFalse}>Desativar</button>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isNotificationsEnabled}
              onChange={toggleNotifications}
            />
            Notificações
          </label>
        </div>
      </div>
      <div className="info">
        <p>Modo escuro: {isDarkMode ? 'Ativado' : 'Desativado'}</p>
        <p>
          Notificações: {isNotificationsEnabled ? 'Ativadas' : 'Desativadas'}
        </p>
      </div>
    </div>
  );
}

// Example 5: Number operations
export function NumberExample() {
  const {
    value: counter,
    increment,
    decrement,
    multiply,
    divide,
    reset,
    clamp,
  } = useLocalStorageNumber('counter', 0);

  const {
    value: score,
    setValue: setScore,
    increment: incrementScore,
  } = useLocalStorageNumber('game-score', 0);

  return (
    <div className="example-container">
      <h2>Number Operations</h2>
      <div className="counters">
        <div>
          <h3>Contador: {counter}</h3>
          <button onClick={() => increment()}>+1</button>
          <button onClick={() => increment(5)}>+5</button>
          <button onClick={() => decrement()}>-1</button>
          <button onClick={() => multiply(2)}>×2</button>
          <button onClick={() => divide(2)}>÷2</button>
          <button onClick={() => clamp(0, 100)}>Clamp 0-100</button>
          <button onClick={reset}>Reset</button>
        </div>
        <div>
          <h3>Pontuação: {score}</h3>
          <button onClick={() => incrementScore(10)}>+10 pontos</button>
          <button onClick={() => incrementScore(50)}>+50 pontos</button>
          <button onClick={() => setScore(0)}>Reset Score</button>
        </div>
      </div>
    </div>
  );
}

// Example 6: Cache for API data
export function CacheExample() {
  const {
    data: userInfo,
    isLoading,
    error,
    isStale,
    refetch,
    invalidate,
  } = useLocalStorageCache(
    'user-info',
    async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        lastLogin: new Date().toISOString(),
      };
    },
    {
      staleTime: 10000, // 10 seconds
      cacheTime: 60000, // 1 minute
      refetchOnWindowFocus: true,
    },
  );

  return (
    <div className="example-container">
      <h2>API Cache</h2>
      <div className="api-status">
        <p>Status: {isLoading ? 'Carregando...' : 'Carregado'}</p>
        <p>Dados antigos: {isStale ? 'Sim' : 'Não'}</p>
        {error && <p style={{ color: 'red' }}>Erro: {error.message}</p>}
      </div>
      <div className="actions">
        <button onClick={refetch} disabled={isLoading}>
          Recarregar
        </button>
        <button onClick={invalidate}>Invalidar Cache</button>
      </div>
      {userInfo && (
        <div className="user-info">
          <h3>Informações do Usuário</h3>
          <p>Nome: {userInfo.name}</p>
          <p>Email: {userInfo.email}</p>
          <p>Último login: {new Date(userInfo.lastLogin).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

// Example 7: Storage utilities
export function UtilitiesExample() {
  const [storageInfo, setStorageInfo] = React.useState(
    localStorageManager.getStorageInfo(),
  );
  const [isAvailable, setIsAvailable] = React.useState(
    localStorageUtils.isAvailable(),
  );

  const refreshInfo = () => {
    setStorageInfo(localStorageManager.getStorageInfo());
    setIsAvailable(localStorageUtils.isAvailable());
  };

  const exportData = () => {
    const data = localStorageUtils.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localStorage-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanupExpired = () => {
    const cleaned = localStorageManager.cleanupExpiredItems();
    alert(`${cleaned} itens expirados foram removidos`);
    refreshInfo();
  };

  return (
    <div className="example-container">
      <h2>Storage Utilities</h2>
      <div className="info">
        <p>LocalStorage disponível: {isAvailable ? 'Sim' : 'Não'}</p>
        <p>Espaço usado: {(storageInfo.used / 1024).toFixed(2)} KB</p>
        <p>Espaço restante: {(storageInfo.remaining / 1024).toFixed(2)} KB</p>
        <p>Total: {(storageInfo.total / 1024).toFixed(2)} KB</p>
      </div>
      <div className="actions">
        <button onClick={refreshInfo}>Atualizar Info</button>
        <button onClick={exportData}>Exportar Dados</button>
        <button onClick={cleanupExpired}>Limpar Expirados</button>
      </div>
    </div>
  );
}

// Main demo component
export function LocalStorageDemo() {
  return (
    <div className="demo-container">
      <h1>React LocalStorage Hook Library - Demonstração</h1>

      <div className="examples-grid">
        <BasicExample />
        <ArrayExample />
        <ObjectExample />
        <BooleanExample />
        <NumberExample />
        <CacheExample />
        <UtilitiesExample />
      </div>

      <style>{`
        .demo-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .example-container {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .example-container h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #007acc;
          padding-bottom: 10px;
        }

        .controls, .actions {
          margin: 15px 0;
        }

        .controls button, .actions button {
          margin-right: 10px;
          margin-bottom: 5px;
          padding: 8px 16px;
          border: 1px solid #007acc;
          background: #007acc;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .controls button:hover, .actions button:hover {
          background: #005a9e;
        }

        .controls button:disabled, .actions button:disabled {
          background: #ccc;
          border-color: #ccc;
          cursor: not-allowed;
        }

        .info {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .info p {
          margin: 5px 0;
        }

        .form input, .form textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 5px 0;
        }

        .task-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .task {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #eee;
        }

        .task.completed {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .task button {
          padding: 4px 8px;
          margin-left: 5px;
          font-size: 12px;
        }

        .toggles {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toggles label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .counters {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .api-status {
          margin: 10px 0;
        }

        .user-info {
          background: #e8f4f8;
          padding: 15px;
          border-radius: 4px;
        }

        .search input {
          width: 100%;
          padding: 10px;
          font-size: 16px;
        }

        .editor textarea {
          width: 100%;
          resize: vertical;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
