# Command Handler Module

Модуль для генерации обработчиков команд Telegram бота.

## Файлы

- `generateCommandHandler.ts` - Генерация обработчиков пользовательских команд
- `generateStartHandler.ts` - Специальный генератор для команды /start

## Использование

```typescript
import { generateCommandHandler, generateStartHandler } from './CommandHandler';

// Генерация обработчика команды /start
const startHandler = generateStartHandler(nodes, connections);

// Генерация обработчика пользовательской команды
const customHandler = generateCommandHandler(commandNode, nodes);
```

## Особенности

- Поддержка команд с параметрами
- Интеграция с системой узлов и переходов
- Автоматическая генерация Python кода для aiogram