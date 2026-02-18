# Hooks

Кастомные React хуки для переиспользуемой логики в Telegram Bot Builder.

## Категории хуков

### API хуки
Хуки для взаимодействия с серверным API:
- `useAuth()` - аутентификация пользователя
- `useBots()` - управление ботами
- `useTemplates()` - работа с шаблонами
- `useFiles()` - загрузка и управление файлами

### Состояние приложения
Хуки для управления глобальным состоянием:
- `useAppState()` - общее состояние приложения
- `useTheme()` - управление темой интерфейса
- `useSettings()` - пользовательские настройки
- `useNotifications()` - система уведомлений

### UI хуки
Хуки для работы с пользовательским интерфейсом:
- `useModal()` - управление модальными окнами
- `useToast()` - всплывающие уведомления
- `useClipboard()` - работа с буфером обмена
- `useLocalStorage()` - локальное хранилище

### Утилитарные хуки
Вспомогательные хуки общего назначения:
- `useDebounce()` - задержка выполнения функций
- `useInterval()` - интервальное выполнение
- `useEventListener()` - подписка на события
- `useMediaQuery()` - медиа-запросы

## Примеры реализации

### API хук
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const userData = await authApi.login(credentials);
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (err) {
        // Пользователь не авторизован
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
}
```

### Состояние приложения
```typescript
// hooks/useAppState.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  currentBot: Bot | null;
  selectedNodes: string[];
  
  setSidebarOpen: (open: boolean) => void;
  setCurrentBot: (bot: Bot | null) => void;
  setSelectedNodes: (nodes: string[]) => void;
  addSelectedNode: (nodeId: string) => void;
  removeSelectedNode: (nodeId: string) => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      currentBot: null,
      selectedNodes: [],
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentBot: (bot) => set({ currentBot: bot }),
      setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
      
      addSelectedNode: (nodeId) => {
        const { selectedNodes } = get();
        if (!selectedNodes.includes(nodeId)) {
          set({ selectedNodes: [...selectedNodes, nodeId] });
        }
      },
      
      removeSelectedNode: (nodeId) => {
        const { selectedNodes } = get();
        set({ 
          selectedNodes: selectedNodes.filter(id => id !== nodeId) 
        });
      }
    }),
    {
      name: 'app-state',
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen 
      })
    }
  )
);
```

### UI хук
```typescript
// hooks/useModal.ts
import { useState, useCallback } from 'react';

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle
  };
}
```

### Утилитарный хук
```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Использование
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Выполнить поиск
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Поиск..."
    />
  );
}
```

## Паттерны хуков

### Составные хуки
Хуки, которые используют другие хуки:
```typescript
// hooks/useBotEditor.ts
export function useBotEditor(botId: string) {
  const { currentBot, setCurrentBot } = useAppState();
  const { data: bot, loading } = useQuery(['bot', botId], () => fetchBot(botId));
  const { mutate: updateBot } = useMutation(updateBotApi);
  
  useEffect(() => {
    if (bot) {
      setCurrentBot(bot);
    }
  }, [bot, setCurrentBot]);

  const saveBot = useCallback((updates) => {
    updateBot({ id: botId, ...updates });
  }, [botId, updateBot]);

  return {
    bot: currentBot,
    loading,
    saveBot
  };
}
```

### Хуки с cleanup
Хуки, которые требуют очистки ресурсов:
```typescript
// hooks/useWebSocket.ts
export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }, [socket]);

  return {
    lastMessage,
    sendMessage
  };
}
```

### Хуки с параметрами
Хуки, которые принимают конфигурацию:
```typescript
// hooks/useApi.ts
interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useApi<T>(
  endpoint: string, 
  options: UseApiOptions<T> = {}
) {
  const { initialData, enabled = true, refetchInterval } = options;
  
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => fetch(endpoint).then(res => res.json()),
    initialData,
    enabled,
    refetchInterval
  });
}
```

## Тестирование хуков

### Тестирование с renderHook
```typescript
// hooks/__tests__/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

### Мокирование зависимостей
```typescript
// hooks/__tests__/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { authApi } from '@/lib/api';

jest.mock('@/lib/api');

describe('useAuth', () => {
  it('should login user', async () => {
    const mockUser = { id: 1, name: 'John' };
    (authApi.login as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login({ email: 'test@test.com', password: 'password' });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });
});
```

## Лучшие практики

### Именование хуков
- Всегда начинайте с префикса `use`
- Используйте описательные имена: `useUserProfile`, `useBotEditor`
- Для булевых состояний: `useIsLoading`, `useHasPermission`

### Возвращаемые значения
- Возвращайте объект для множественных значений
- Используйте деструктуризацию для удобства
- Группируйте связанные значения

### Зависимости
- Всегда указывайте зависимости в useEffect
- Используйте useCallback для функций в зависимостях
- Мемоизируйте сложные вычисления с useMemo

### Обработка ошибок
- Всегда обрабатывайте ошибки в асинхронных операциях
- Предоставляйте способы сброса ошибок
- Логируйте ошибки для отладки