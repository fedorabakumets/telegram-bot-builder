# Шаблон callback-handler-init

## Описание

Генерирует начальный блок callback-обработчика: ответ на callback, инициализация переменных пользователя, опциональное сохранение variableFilters.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodeId` | `string` | Да | — | ID узла |
| `hasHideAfterClick` | `boolean` | Да | — | Есть ли кнопки с hideAfterClick |
| `variableFilters` | `Record<string, any> \| null` | Нет | `null` | Фильтры переменных |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateCallbackHandlerInit } from './callback-handler-init.renderer';

const code = generateCallbackHandlerInit({
  nodeId: 'node_1',
  hasHideAfterClick: false,
  variableFilters: null,
});
```

## Тесты

```bash
npm run test:callback-handler-init
```
