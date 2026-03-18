# Тесты для Sidebar Module

Эта директория содержит тесты для модуля боковой панели редактора ботов.

## Структура

```
tests/
├── unit/                    # Unit-тесты
│   ├── utils/              # Тесты утилит
│   │   ├── format-date.test.ts
│   │   ├── get-node-count.test.ts
│   │   ├── get-sheets-info.test.ts
│   │   └── parse-python-code-to-json.test.ts
│   ├── handlers/           # Тесты обработчиков
│   │   └── project-drag-handlers.test.ts
│   └── massive/            # Тесты компонентов
│       ├── components.test.ts
│       ├── commands.test.ts
│       └── messages.test.ts
└── integration/            # Интеграционные тесты (TODO)
    └── components-sidebar.test.tsx
```

## Запуск тестов

### Все тесты sidebar
```bash
npm test -- --pattern sidebar
```

### Unit-тесты утилит
```bash
npm test -- --pattern "sidebar.*utils"
```

### Тесты handlers
```bash
npm test -- --pattern "sidebar.*handlers"
```

### Тесты компонентов
```bash
npm test -- --pattern "sidebar.*massive"
```

## Покрытие

Для запуска с покрытием:
```bash
npm run test:coverage -- --pattern sidebar
```

## Добавление новых тестов

1. Создайте файл с расширением `.test.ts` в соответствующей директории
2. Используйте `describe` для группировки тестов
3. Используйте `it` для отдельных тестовых случаев
4. Следуйте паттерну: Arrange-Act-Assert

### Пример
```typescript
/// <reference types="vitest/globals" />

import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('должен возвращать правильное значение', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

## Статус тестов

| Модуль | Статус | Файлы |
|--------|--------|-------|
| Utils | ✅ Готово | 4 файла |
| Handlers | ✅ Готово | 1 файл |
| Massive Components | ✅ Готово | 3 файла |
| Components Sidebar | ⏳ TODO | - |

## TODO

- [ ] Интеграционные тесты для `components-sidebar.tsx`
- [ ] Тесты для user-management компонентов
- [ ] Тесты для content-management компонентов
- [ ] Тесты для canvas-node компонентов (broadcast, client-auth)
