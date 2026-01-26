# Shared

Общие схемы, типы и утилиты, используемые как на клиенте, так и на сервере.

## Структура

### Основные файлы
- `schema.ts` - схемы базы данных и валидации с использованием Drizzle ORM и Zod

## Содержимое

### `schema.ts`
Содержит:
- **Схемы таблиц базы данных** - определения таблиц для Drizzle ORM
- **Zod схемы валидации** - схемы для валидации входящих данных
- **TypeScript типы** - типы, выводимые из схем базы данных
- **Отношения между таблицами** - связи между сущностями

#### Основные таблицы
- `users` - пользователи системы
- `bots` - созданные боты
- `templates` - шаблоны ботов
- `bot_nodes` - узлы в конструкторе ботов
- `bot_connections` - связи между узлами
- `files` - загруженные файлы

#### Типы данных
```typescript
// Примеры типов, экспортируемых из схемы
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;
```

## Использование

### На сервере
```typescript
import { users, bots, db } from '@/shared/schema';

// Использование в запросах к базе данных
const allUsers = await db.select().from(users);
```

### На клиенте
```typescript
import type { User, Bot } from '@/shared/schema';

// Использование типов в компонентах
interface Props {
  user: User;
  bots: Bot[];
}
```

## Технологии

- **Drizzle ORM** - типобезопасный ORM для работы с базой данных
- **Zod** - библиотека для валидации схем
- **PostgreSQL** - основная база данных
- **TypeScript** - строгая типизация