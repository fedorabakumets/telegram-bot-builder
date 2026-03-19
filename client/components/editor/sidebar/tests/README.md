# Тесты для Sidebar Module

Эта директория содержит тесты для модуля боковой панели редактора ботов.

## Структура

```
tests/
├── setup-tests.ts              # Setup файл для тестов
├── README.md                   # Документация
└── unit/
    ├── utils/                  # Тесты утилит
    │   ├── format-date.test.ts
    │   ├── get-node-count.test.ts
    │   ├── get-sheets-info.test.ts
    │   └── parse-python-code-to-json.test.ts
    ├── handlers/               # Тесты обработчиков
    │   └── project-drag-handlers.test.ts
    └── massive/                # Тесты компонентов
        ├── components.test.ts
        ├── commands.test.ts
        ├── messages.test.ts
        ├── user-management.test.ts
        ├── content-management.test.ts
        └── canvas-nodes.test.ts
```

## Запуск тестов

### Все тесты sidebar
```bash
npm run test:sidebar
```

### Тесты в режиме watch
```bash
npm run test:sidebar:watch
```

### Тесты с покрытием
```bash
npm run test:sidebar:coverage
```

### Отдельные группы тестов
```bash
# Утилиты
npx vitest run client/components/editor/sidebar/tests/unit/utils

# Handlers
npx vitest run client/components/editor/sidebar/tests/unit/handlers

# Компоненты
npx vitest run client/components/editor/sidebar/tests/unit/massive
```

## Покрытие

Для запуска с покрытием:
```bash
npm run test:sidebar:coverage
```

Отчёт будет доступен в папке `coverage/`.

## Добавление новых тестов

1. Создайте файл с расширением `.test.ts` в соответствующей директории
2. Используйте `describe` для группировки тестов
3. Используйте `it` для отдельных тестовых случаев
4. Следуйте паттерну: Arrange-Act-Assert

### Пример
```typescript
/// <reference types="vitest/globals" />

import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('должен возвращать правильное значение', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

## Статус тестов

| Модуль | Статус | Файлы | Тесты |
|--------|--------|-------|-------|
| Utils: format-date | ✅ Готово | 1 | 8 |
| Utils: get-node-count | ✅ Готово | 1 | 10 |
| Utils: get-sheets-info | ✅ Готово | 1 | 9 |
| Utils: parse-python-code-to-json | ✅ Готово | 1 | 35 |
| Handlers: project-drag | ✅ Готово | 1 | 16 |
| Massive: Commands | ✅ Готово | 1 | 15 |
| Massive: Messages | ✅ Готово | 1 | 17 |
| Massive: User Management | ✅ Готово | 1 | 55 |
| Massive: Content Management | ✅ Готово | 1 | 9 |
| Massive: Components | ✅ Готово | 1 | 5 |
| Canvas Nodes | ✅ Готово | 1 | 20 |
| **ИТОГО** | ✅ **100%** | **11** | **199** |

## Покрытие кода

| Файл | Покрытие |
|------|----------|
| format-date.ts | 100% |
| get-node-count.ts | 100% |
| get-sheets-info.ts | 100% |
| parsePythonCodeToJson.ts | 95% |
| handle-project-*.ts | 100% |
| massive/**/*.ts | 100% |

## TODO

- [ ] Интеграционные тесты для `components-sidebar.tsx`
- [ ] Тесты для дополнительных canvas-node компонентов
- [ ] E2E тесты для drag-and-drop
