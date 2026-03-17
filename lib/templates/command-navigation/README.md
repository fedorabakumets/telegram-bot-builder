# Шаблон command-navigation

## Описание

Генерирует Python-код для вызова обработчика команды через `fake_message` из callback-контекста.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `commandName` | `string` | Да | — | Имя команды без '/' (например `start`, `help`) |
| `handlerName` | `string` | Да | — | Имя функции-обработчика (например `start_handler`) |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateCommandNavigation } from './command-navigation.renderer';

const code = generateCommandNavigation({
  commandName: 'start',
  handlerName: 'start_handler',
});
```

## Тесты

```bash
npm run test:command-navigation
```
