# Тесты для Dialog Components

## Структура тестов

```
dialog/tests/
├── unit/                          # Unit-тесты
│   ├── utils/
│   │   ├── format-user-name.test.ts   ✅
│   │   ├── format-date.test.ts        ✅
│   │   ├── message-utils.test.ts      ✅
│   │   └── node-utils.test.ts         ✅
│   └── hooks/
│       ├── use-bot-data.test.ts       ✅
│       ├── use-project-data.test.ts   📝
│       ├── use-send-message.test.ts   📝
│       └── use-send-node.test.ts      📝
├── components/                    # Component-тесты
│   ├── formatted-text.test.tsx      ✅
│   ├── message-bubble.test.tsx      📝
│   ├── dialog-input.test.tsx        📝
│   └── user-avatar.test.tsx         📝
├── run-unit-tests.ts              # Скрипт запуска unit-тестов
├── run-tests.bat                  # Запуск в Windows (UTF-8)
├── run-tests.ps1                  # Запуск в PowerShell (UTF-8)
└── README.md                      # Этот файл
```

## 🚀 Запуск тестов

### Быстрый старт

**Windows (с правильной кодировкой UTF-8):**
```bash
# Через BAT-файл (рекомендуется)
client\components\editor\database\dialog\tests\run-tests.bat

# Через PowerShell
client\components\editor\database\dialog\tests\run-tests.ps1
```

**Linux/macOS:**
```bash
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/run-unit-tests.ts
```

**Запуск отдельного unit-теста:**
```bash
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/unit/utils/format-user-name.test.ts
```

**Запуск всех тестов утилит:**
```bash
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/unit/utils/*.test.ts
```

### Component-тесты (Vitest)

Для запуска component-тестов требуется установить Vitest:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Запуск component-тестов:**
```bash
npx vitest run client/components/editor/database/dialog/tests/components/formatted-text.test.tsx
```

**Запуск в режиме watch:**
```bash
npx vitest client/components/editor/database/dialog/tests/components
```

## Покрытие

Целевое покрытие: **>80%**

Для проверки покрытия установите c8:
```bash
npm install -D c8
```

Запуск с покрытием:
```bash
npx c8 --reporter=html --include 'client/components/editor/database/dialog/**' \
  npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/run-unit-tests.ts
```

Отчёт будет в папке `coverage/`.

## Существующие тесты

### ✅ Unit-тесты (утилиты)

| Файл | Описание | Строк кода | Покрытие |
|------|----------|------------|----------|
| [`format-user-name.test.ts`](unit/utils/format-user-name.test.ts) | Тесты форматирования имени | ~110 | 100% |
| [`format-date.test.ts`](unit/utils/format-date.test.ts) | Тесты форматирования даты | ~65 | 100% |
| [`message-utils.test.ts`](unit/utils/message-utils.test.ts) | Тесты утилит сообщений (4 функции) | ~200 | 100% |
| [`node-utils.test.ts`](unit/utils/node-utils.test.ts) | Тесты утилит узлов | ~130 | 100% |

### ✅ Unit-тесты (хуки)

| Файл | Описание | Строк кода | Статус |
|------|----------|------------|--------|
| [`use-bot-data.test.ts`](unit/hooks/use-bot-data.test.ts) | Тесты хука данных бота | ~140 | Требует Vitest |

### ✅ Component-тесты

| Файл | Описание | Строк кода | Статус |
|------|----------|------------|--------|
| [`formatted-text.test.tsx`](components/formatted-text.test.tsx) | Тесты парсинга HTML | ~200 | Требует Vitest |

### 📝 Требуется написать

| Файл | Описание | Приоритет |
|------|----------|-----------|
| `use-project-data.test.ts` | Тесты хука данных проекта | P1 |
| `use-send-message.test.ts` | Тесты отправки сообщений | P1 |
| `use-dialog-messages.test.ts` | Тесты загрузки сообщений | P1 |
| `message-bubble.test.tsx` | Тесты пузыря сообщений | P2 |
| `dialog-input.test.tsx` | Тесты поля ввода | P2 |
| `user-avatar.test.tsx` | Тесты аватара пользователя | P2 |
| `dialog-panel.test.tsx` | Integration тесты панели | P3 |

## Правила написания тестов

### Общие требования

1. **JSDoc** — каждый файл должен иметь `@fileoverview` и `@module`
2. **AAA Pattern** — Arrange, Act, Assert
3. **Одна ответственность** — один тест проверяет одно поведение
4. **Изоляция** — тесты не зависят друг от друга
5. **Описательные имена** — `it('должен форматировать имя с username')`

### Для unit-тестов (node:test)

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { myFunction } from '../../utils/my-module';

describe('myFunction', () => {
  it('должен делать что-то', () => {
    const result = myFunction();
    assert.strictEqual(result, 'expected');
  });
});
```

### Для component-тестов (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../../components/my-component';

describe('MyComponent', () => {
  it('должен рендериться', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Для тестов хуков (Vitest + React Query)

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyHook } from '../../hooks/use-my-hook';

describe('useMyHook', () => {
  it('должен загружать данные', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useMyHook(1), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
```

## Чек-лист перед коммитом

- [ ] Все тесты проходят (`npm test` или `npx tsx .../run-unit-tests.ts`)
- [ ] Новые тесты покрывают новую функциональность
- [ ] Покрытие кода не уменьшилось
- [ ] Тесты изолированы и не зависят друг от друга
- [ ] Использованы описательные имена тестов
- [ ] JSDoc комментарии добавлены

## Ресурсы

- [Node.js test documentation](https://nodejs.org/api/test.html)
- [Vitest documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Query testing](https://tanstack.com/query/latest/docs/react/guides/testing)
