# User Handler Module

Модуль для генерации обработчиков управления пользователями и администрирования.

## Файлы

- `generateAdminRightsHandler.ts` - Обработчик управления правами администратора
- `generateAdminRightsToggleHandlers.ts` - Переключатели прав администратора
- `generateBanUserHandler.ts` - Обработчик блокировки пользователей
- `generateDemoteUserHandler.ts` - Обработчик понижения в правах
- `generateKickUserHandler.ts` - Обработчик исключения пользователей
- `generateMuteUserHandler.ts` - Обработчик отключения звука пользователей
- `generatePromoteUserHandler.ts` - Обработчик повышения в правах
- `generateUnbanUserHandler.ts` - Обработчик разблокировки пользователей
- `generateUnmuteUserHandler.ts` - Обработчик включения звука пользователей
- `generateUserManagementSynonymHandler.ts` - Синонимы команд управления пользователями

## Использование

```typescript
import { 
  generateBanUserHandler,
  generateMuteUserHandler,
  generatePromoteUserHandler,
  generateUserManagementSynonymHandler 
} from './UserHandler';

// Генерация обработчика блокировки
const banHandler = generateBanUserHandler(adminNodes);

// Генерация обработчика повышения
const promoteHandler = generatePromoteUserHandler(ownerNodes);
```

## Функции управления пользователями

### Модерация
- **Ban/Unban** - блокировка и разблокировка пользователей
- **Mute/Unmute** - отключение и включение возможности писать
- **Kick** - исключение пользователей из группы

### Администрирование
- **Promote** - назначение администраторских прав
- **Demote** - снятие администраторских прав
- **Admin Rights** - управление конкретными правами

### Синонимы
- Альтернативные команды для всех функций управления

## Особенности

- Проверка прав доступа
- Валидация целевых пользователей
- Обработка ошибок Telegram API
- Логирование административных действий
- Поддержка временных ограничений
- Интеграция с системой разрешений