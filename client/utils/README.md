# Utils

Вспомогательные функции и утилиты общего назначения для Telegram Bot Builder.

## Категории утилит

### Форматирование данных
- `formatDate()` - форматирование дат
- `formatFileSize()` - форматирование размера файлов
- `formatNumber()` - форматирование чисел
- `formatCurrency()` - форматирование валют

### Валидация
- `validateEmail()` - валидация email адресов
- `validatePassword()` - валидация паролей
- `validateUrl()` - валидация URL
- `validateBotToken()` - валидация Telegram токенов

### Работа со строками
- `slugify()` - создание URL-friendly строк
- `truncate()` - обрезка строк
- `capitalize()` - капитализация
- `camelCase()` - преобразование в camelCase

### Работа с объектами
- `deepClone()` - глубокое клонирование
- `deepMerge()` - глубокое слияние объектов
- `pick()` - выбор полей из объекта
- `omit()` - исключение полей из объекта

### Асинхронные операции
- `delay()` - задержка выполнения
- `retry()` - повторные попытки
- `timeout()` - таймаут для промисов
- `debounce()` - дебаунсинг функций

## Примеры реализации

### Форматирование данных
```typescript
// utils/format.ts
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('ru-RU');
    case 'long':
      return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'relative':
      return formatRelativeTime(d);
    default:
      return d.toLocaleDateString('ru-RU');
  }
}

export function formatFileSize(bytes: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatNumber(
  num: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('ru-RU', options).format(num);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'только что';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн назад`;
  
  return formatDate(date, 'short');
}
```

### Валидация
```typescript
// utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать заглавную букву');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать строчную букву');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать цифру');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateBotToken(token: string): boolean {
  // Telegram bot token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
  const tokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
  return tokenRegex.test(token);
}
```

### Работа со строками
```typescript
// utils/string.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
    .replace(/[\s_-]+/g, '-') // Заменяем пробелы и подчеркивания на дефисы
    .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце
}

export function truncate(
  text: string, 
  maxLength: number, 
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function camelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function kebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
```

### Работа с объектами
```typescript
// utils/object.ts
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

export function pick<T, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omit<T, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}
```

### Асинхронные операции
```typescript
// utils/async.ts
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt); // Экспоненциальная задержка
    }
  }
  
  throw lastError!;
}

export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### Работа с массивами
```typescript
// utils/array.ts
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Константы
```typescript
// utils/constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
  BOTS: {
    LIST: '/api/bots',
    CREATE: '/api/bots',
    UPDATE: (id: string) => `/api/bots/${id}`,
    DELETE: (id: string) => `/api/bots/${id}`,
  },
  FILES: {
    UPLOAD: '/api/files/upload',
    GET: (id: string) => `/api/files/${id}`,
    DELETE: (id: string) => `/api/files/${id}`,
  },
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  BOT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

export const FILE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ],
} as const;

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;
```

## Организация утилит

### Индексный файл
```typescript
// utils/index.ts
export * from './format';
export * from './validation';
export * from './string';
export * from './object';
export * from './array';
export * from './async';
export * from './constants';
```

### Тестирование утилит
```typescript
// utils/__tests__/format.test.ts
import { formatDate, formatFileSize } from '../format';

describe('format utils', () => {
  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2023-12-25');
      expect(formatDate(date, 'short')).toBe('25.12.2023');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 КБ');
      expect(formatFileSize(1048576)).toBe('1.0 МБ');
    });
  });
});
```

## Лучшие практики

### Чистые функции
- Избегайте побочных эффектов
- Возвращайте новые объекты вместо мутации
- Делайте функции предсказуемыми

### Типизация
- Используйте строгую типизацию
- Добавляйте дженерики для переиспользования
- Документируйте сложные типы

### Производительность
- Мемоизируйте дорогие вычисления
- Используйте ленивые вычисления
- Оптимизируйте для частых операций

### Тестирование
- Покрывайте тестами все утилиты
- Тестируйте граничные случаи
- Используйте property-based тестирование