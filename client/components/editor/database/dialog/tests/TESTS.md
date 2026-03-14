# 🧪 Тесты для Dialog Components

**Статус:** ✅ 45 тестов создано и работают

## Структура тестов

```
dialog/tests/
├── unit/                          # Unit-тесты (node:test) ✅
│   ├── utils/                     ✅ 45 тестов работают
│   │   ├── format-user-name.test.ts   ✅ 10 тестов
│   │   ├── format-date.test.ts        ✅ 8 тестов
│   │   ├── message-utils.test.ts      ✅ 17 тестов
│   │   └── node-utils.test.ts         ✅ 10 тестов
│   └── hooks/                       📝 Шаблоны (требуют настройки)
│       ├── use-bot-data.test.tsx      ✅ 5 тестов (шаблон)
│       └── use-dialog-messages.test.tsx ✅ 7 тестов (шаблон)
├── components/                    📝 Шаблоны (требуют настройки)
│   ├── formatted-text.test.tsx      ✅ 20 тестов (шаблон)
│   ├── message-bubble.test.tsx      ✅ 24 теста (шаблон)
│   └── message-bubble-simple.test.tsx ✅ 5 тестов (шаблон)
├── run-simple.ts                  # Запуск unit-тестов с UTF-8
├── run-tests.bat                  # Windows (UTF-8)
├── run-tests.ps1                  # PowerShell (UTF-8)
├── vitest.config.ts               # Конфиг для Vitest
├── setup-tests.ts                 # Setup для тестов
└── README.md                      # Документация
```

## 🚀 Быстрый старт

### Запуск unit-тестов (работают ✅)

```bash
# Все unit-тесты утилит
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/run-simple.ts

# Отдельный тест
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/unit/utils/format-user-name.test.ts
```

### Запуск тестов компонентов (📝 требуют настройки)

Тесты компонентов и хуков используют Vitest и требуют дополнительной настройки:

```bash
# Установка зависимостей (выполнено)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Запуск тестов компонентов (требует настройки окружения)
npx vitest run client/components/editor/database/dialog/tests/components/message-bubble.test.tsx
```

**Примечание:** Тесты компонентов требуют настройки моков для React Query и других зависимостей.

## 📊 Статистика тестов

| Категория | Файлов | Тестов | Статус |
|-----------|--------|--------|--------|
| **Утилиты** | 4 | 45 | ✅ Все проходят |
| **Хуки** | 2 | 12 | 📝 Шаблоны готовы |
| **Компоненты** | 3 | 49 | 📝 Шаблоны готовы |
| **Итого** | 9 | 106 | 45 рабочих + 61 шаблон |

## ✅ Существующие тесты

### Unit-тесты (утилиты) — 45 тестов

Все тесты используют `node:test` и работают из коробки.

| Файл | Тестов | Описание |
|------|--------|----------|
| [`format-user-name.test.ts`](unit/utils/format-user-name.test.ts) | 10 | Форматирование имени пользователя |
| [`format-date.test.ts`](unit/utils/format-date.test.ts) | 8 | Форматирование даты |
| [`message-utils.test.ts`](unit/utils/message-utils.test.ts) | 17 | Утилиты кнопок сообщений (4 функции) |
| [`node-utils.test.ts`](unit/utils/node-utils.test.ts) | 10 | Утилиты узлов проекта |

**Запуск всех тестов утилит:**

```bash
# Последовательный запуск всех тестов
for file in client/components/editor/database/dialog/tests/unit/utils/*.test.ts; do
  npx tsx --tsconfig tsconfig.json "$file"
done
```

### 📝 Шаблоны тестов для сообщений

#### Хуки (Vitest + React Query)

| Файл | Тестов | Описание |
|------|--------|----------|
| [`use-bot-data.test.ts`](unit/hooks/use-bot-data.test.ts) | 5 | Загрузка данных бота |
| [`use-dialog-messages.test.ts`](unit/hooks/use-dialog-messages.test.ts) | 7 | Загрузка сообщений диалога |

**Тестируемые сценарии:**
- ✅ Успешная загрузка сообщений
- ✅ Обработка ошибок API
- ✅ Кэширование данных
- ✅ Повторный запрос при изменении userId
- ✅ Возврат пустого массива при отсутствии userId

#### Компоненты (Vitest + Testing Library)

| Файл | Тестов | Описание |
|------|--------|----------|
| [`formatted-text.test.tsx`](components/formatted-text.test.tsx) | 20 | Парсинг HTML-форматирования |
| [`message-bubble.test.tsx`](components/message-bubble.test.tsx) | 24 | Отображение сообщений |

**Тестируемые сценарии для MessageBubble:**
- ✅ Отображение сообщений бота/пользователя
- ✅ Форматирование текста (HTML теги)
- ✅ Кнопки сообщений (отображение/нажатие)
- ✅ Временные метки
- ✅ Аватары
- ✅ Медиафайлы (фото, видео)
- ✅ DOM структура и CSS классы

## 📝 Шаблоны тестов

### Unit-тесты (утилиты)

Готовые шаблоны для тестирования утилит:

```typescript
/**
 * @fileoverview Тесты для модуля
 * @module tests/unit/utils/module.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { myFunction } from '../../../utils/my-module';

describe('myFunction', () => {
  it('должен делать что-то', () => {
    const result = myFunction();
    assert.strictEqual(result, 'expected');
  });
});
```

### Component-тесты (Vitest)

Требуется установка зависимостей:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Шаблон теста:

```typescript
/**
 * @fileoverview Тесты для компонента
 * @module tests/components/component.test
 */

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

### Тесты хуков (Vitest + React Query)

```typescript
/**
 * @fileoverview Тесты для хука
 * @module tests/unit/hooks/hook.test
 */

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

## 📋 Чек-лист перед коммитом

- [ ] Все тесты проходят
- [ ] Новые тесты покрывают новую функциональность
- [ ] Тесты изолированы и не зависят друг от друга
- [ ] Использованы описательные имена тестов
- [ ] JSDoc комментарии добавлены

## 🔧 Настройка CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: |
        npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/unit/utils/*.test.ts
```

## 📈 Покрытие кода

Для измерения покрытия установите c8:

```bash
npm install -D c8
```

Запуск с покрытием:

```bash
npx c8 --reporter=html \
  npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/unit/utils/format-user-name.test.ts
```

Отчёт будет в папке `coverage/`.

## 🎯 Следующие шаги

1. **Установить Vitest** для component-тестов
2. **Написать тесты хуков** (use-project-data, use-send-message)
3. **Написать тесты компонентов** (message-bubble, dialog-input)
4. **Настроить CI/CD** для автоматического запуска тестов

## 📚 Ресурсы

- [Node.js test documentation](https://nodejs.org/api/test.html)
- [Vitest documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Query testing](https://tanstack.com/query/latest/docs/react/guides/testing)
