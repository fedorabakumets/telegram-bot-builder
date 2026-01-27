# Message Handler Module

Модуль для генерации обработчиков управления сообщениями.

## Файлы

- `generateContentManagementSynonymHandler.ts` - Обработчик синонимов управления контентом
- `generateDeleteMessageHandler.ts` - Обработчик удаления сообщений
- `generatePinMessageHandler.ts` - Обработчик закрепления сообщений
- `generateUnpinMessageHandler.ts` - Обработчик открепления сообщений

## Использование

```typescript
import { 
  generateDeleteMessageHandler,
  generatePinMessageHandler,
  generateUnpinMessageHandler,
  generateContentManagementSynonymHandler 
} from './MessageHandler';

// Генерация обработчика удаления сообщений
const deleteHandler = generateDeleteMessageHandler(adminNodes);

// Генерация обработчика закрепления
const pinHandler = generatePinMessageHandler(moderatorNodes);
```

## Функции управления сообщениями

### Модерация контента
- **Удаление сообщений** - удаление сообщений пользователей
- **Закрепление сообщений** - закрепление важных сообщений
- **Открепление сообщений** - открепление сообщений

### Синонимы команд
- **Управление контентом** - альтернативные команды для модерации

## Особенности

- Проверка прав администратора/модератора
- Поддержка различных синонимов команд
- Обработка ошибок и исключений
- Логирование действий модерации
- Интеграция с системой разрешений Telegram