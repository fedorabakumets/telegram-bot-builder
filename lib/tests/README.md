# Тестирование

В этом проекте для тестирования используется стандартная библиотека Node.js - `node:test` и `node:assert`.

## Особенности

- Используется `node:test` для запуска тестов
- Используется `node:assert` для проверок
- Тесты находятся в папке `tests/unit/` для unit-тестов
- Интеграционные тесты находятся в `tests/integration/`
- Для запуска тестов используется команда: `npx tsx --tsconfig tsconfig.json path/to/test/file.ts`

## Структура тестов

```
client/lib/tests/
├── unit/                          # Unit-тесты
│   ├── generator-logger.test.ts   # Тесты логгера
│   ├── generation-state.test.ts   # Тесты состояния
│   ├── constants.test.ts          # Тесты констант
│   ├── to-enhanced-node.test.ts   # Тесты конвертации узлов
│   └── validate-enhanced-node.test.ts  # Тесты валидации
├── integration/                   # Интеграционные тесты
│   └── full-generation.test.ts    # Тесты полной генерации
└── README.md                      # Этот файл
```

## Запуск тестов

### Запуск отдельного теста

Чтобы запустить отдельный тест, выполните команду:

```bash
npx tsx --tsconfig tsconfig.json client/lib/tests/unit/generator-logger.test.ts
```

### Запуск всех unit-тестов

Чтобы запустить все unit-тесты:

```bash
npx tsx --tsconfig tsconfig.json client/lib/tests/unit/*.test.ts
```

### Запуск всех тестов

Чтобы запустить все тесты проекта:

```bash
npm test
```

## Покрытие тестами

Целевое покрытие тестами: **>80%**

Для проверки покрытия используйте:

```bash
npx c8 --reporter=html npm test
```

## Написание тестов

### Пример unit-теста

```typescript
/**
 * @fileoverview Тесты для модуля
 * @module tests/unit/module.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { myFunction } from '../../module';

describe('MyModule', () => {
  it('должен делать что-то', () => {
    const result = myFunction();
    assert.strictEqual(result, 'expected');
  });
});
```

### Правила написания

1. **JSDoc комментарии** — каждый тестовый файл должен иметь @fileoverview
2. **Описание тестов** — используйте понятные описания в `it()`
3. **Arrange-Act-Assert** — группируйте код теста по шаблону AAA
4. **Одна проверка — один тест** — не перегружайте тесты
5. **Изоляция** — тесты не должны зависеть друг от друга

## Существующие тесты

### Unit-тесты

| Файл | Описание | Строк |
|------|----------|-------|
| `generator-logger.test.ts` | Тесты логгера | ~165 |
| `generation-state.test.ts` | Тесты состояния генерации | ~140 |
| `constants.test.ts` | Тесты констант | ~185 |
| `to-enhanced-node.test.ts` | Тесты конвертации узлов | ~175 |
| `validate-enhanced-node.test.ts` | Тесты валидации | ~260 |

### Интеграционные тесты

| Файл | Описание | Строк |
|------|----------|-------|
| `full-generation.test.ts` | Тесты полной генерации | ~100 |

## Добавление новых тестов

1. Создайте файл в `tests/unit/` с именем `module-name.test.ts`
2. Добавьте JSDoc комментарий с @fileoverview и @module
3. Опишите тестируемую функциональность в `describe()`
4. Добавьте тесты в `it()` с понятными описаниями
5. Запустите тесты и убедитесь что они проходят

## Отчётность

После запуска тестов отчёт сохраняется в `coverage/` директории.