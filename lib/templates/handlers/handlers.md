# Модуль обработчиков (handlers/)

## Описание

Набор Jinja2 шаблонов для генерации Python обработчиков кнопок и переходов. Каждый подмодуль отвечает за конкретный тип взаимодействия с пользователем.

## Подмодули

### button-response

Обработчик кнопочных ответов при сборе пользовательского ввода.

```typescript
import { generateButtonResponse } from './templates/handlers';
```

### command-callback-handler

Обработчик callback-кнопок, привязанных к командам.

```typescript
import { generateCommandCallbackHandler } from './templates/handlers';
```

### multi-select-button-handler

Обработчик кнопок multi-select с сохранением состояния выбора.

```typescript
import { generateMultiSelectButtonHandler } from './templates/handlers';
```

### multi-select-callback

Обработчик callback для кнопок с галочками (чекбоксами).

```typescript
import { generateMultiSelectCallback } from './templates/handlers';
```

### multi-select-done

Обработчик кнопки "Готово" для завершения multi-select выбора.

```typescript
import { generateMultiSelectDone } from './templates/handlers';
```

### multi-select-reply

Обработчик reply-кнопок в контексте multi-select.

```typescript
import { generateMultiSelectReply } from './templates/handlers';
```

### multi-select-transition

Логика переходов между узлами после завершения multi-select.

```typescript
import { generateMultiSelectTransition } from './templates/handlers';
```

### reply-button-handlers

Обработчики reply-кнопок (ReplyKeyboardMarkup).

```typescript
import { generateReplyButtonHandlers } from './templates/handlers';
```

### reply-hide-after-click

Обработка флага `hideAfterClick` — скрытие reply-клавиатуры после нажатия.

```typescript
import { generateReplyHideAfterClick } from './templates/handlers';
```

## Структура каждого подмодуля

```
<name>/
├── <name>.py.jinja2     (шаблон)
├── <name>.params.ts     (TypeScript интерфейсы)
├── <name>.schema.ts     (Zod схема)
├── <name>.renderer.ts   (функция generate*)
├── <name>.fixture.ts    (тестовые данные)
└── <name>.test.ts       (тесты)
```

## Импорт

Все подмодули реэкспортируются через `handlers/index.ts`:

```typescript
import {
  generateMultiSelectCallback,
  generateMultiSelectDone,
  generateMultiSelectReply,
  generateButtonResponse,
  generateReplyButtonHandlers,
  generateMultiSelectButtonHandler,
  generateCommandCallbackHandler,
  generateReplyHideAfterClick,
  generateMultiSelectTransition,
} from './templates/handlers';
```

## Запуск тестов

```bash
node run-tests.js --pattern handlers
```
