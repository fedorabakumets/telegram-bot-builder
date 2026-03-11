**Дата выпуска:** 11 марта 2026 г.

**Сравнение версий:** [v2.0.0...v2.0.1](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.0...v2.0.1)

---

## 🎯 Основные изменения

### 🔧 Рефакторинг схемы базы данных

Масштабный рефакторинг схемы базы данных для улучшения поддерживаемости и расширяемости.

#### Изменения:

- **Модульная структура** — схема разделена на отдельные файлы по таблицам в папке `shared/schema/tables/`
- **JSDoc документация** — добавлены подробные комментарии ко всем модулям
- **Типизация** — явный экспорт типов для каждой таблицы

#### Новые файлы схем:

| Файл | Описание |
|------|----------|
| `telegram-users.ts` | Таблица аутентифицированных пользователей Telegram |
| `bot-projects.ts` | Таблица проектов ботов |
| `bot-tokens.ts` | Таблица токенов ботов |
| `bot-instances.ts` | Таблица запущенных экземпляров ботов |
| `bot-templates.ts` | Таблица сценариев ботов |
| `media-files.ts` | Таблица медиафайлов |
| `user-bot-data.ts` | Таблица пользовательских данных бота |
| `bot-users.ts` | Таблица пользователей бота |
| `bot-groups.ts` | Таблица групп бота |
| `group-members.ts` | Таблица участников групп |
| `user-telegram-settings.ts` | Таблица настроек Telegram Client API |
| `bot-messages.ts` | Таблица истории сообщений |
| `bot-message-media.ts` | Таблица связи сообщений с медиа |
| `user-ids.ts` | Таблица ID пользователей для рассылки |
| `button-schema.ts` | Схема кнопки бота |
| `node-schema.ts` | Схема узла бота |
| `bot-sheets.ts` | Схемы листов холста и данных бота |
| `additional-schemas.ts` | Дополнительные схемы |
| `index.ts` | Экспорт всех таблиц |

---

### 🆕 Новые поля в схемах

#### Bot Projects

Добавлены поля для экспорта в Google Таблицы:

- `lastExportedGoogleSheetId` — ID последней экспортированной Google Таблицы пользователей
- `lastExportedGoogleSheetUrl` — URL последней экспортированной Google Таблицы пользователей
- `lastExportedAt` — дата последнего экспорта пользователей
- `lastExportedStructureSheetId` — ID последней экспортированной Google Таблицы структуры проекта
- `lastExportedStructureSheetUrl` — URL последней экспортированной Google Таблицы структуры проекта
- `lastExportedStructureAt` — дата последнего экспорта структуры проекта
- `restartOnUpdate` — флаг необходимости перезапуска бота при обновлении

#### User Bot Data

- `avatarUrl` — URL аватарки пользователя

#### Bot Users

- `avatarUrl` — URL аватарки пользователя
- `isBot` — флаг бота (0 = человек, 1 = бот)

#### Bot Messages

- `createdAt` — обновлён тип timestamp с поддержкой timezone

---

### 📦 Обновление версии

- **Версия приложения** обновлена с `2.0.0` до `2.0.1`
- **VersionBadge** — отображает актуальную версию

---

### 🔧 Исправления

#### Исправление импорта LayoutConfig

- **Проблема** — ошибка импорта типа `LayoutConfig` из `layout-manager.tsx`
- **Решение** — создан `index.ts` в папке `layout` для централизованного экспорта типов
- **Путь** — изменён с относительного на алиас `@/components/layout`

---

## 📊 Статистика изменений

| Категория | Файлов изменено | Строк добавлено | Строк удалено |
|-----------|-----------------|-----------------|---------------|
| Рефакторинг схемы | 18 | 2954 | 1276 |
| Обновление версии | 1 | 1 | 1 |
| Исправление импорта | 2 | 6 | 1 |
| **Всего** | **21** | **2961** | **1278** |

---

## 🔧 Технические детали

### Модульная схема

```typescript
// shared/schema/tables/index.ts
export { telegramUsers, insertTelegramUserSchema } from "./telegram-users";
export type { TelegramUser, InsertTelegramUser } from "./telegram-users";

export { botProjects, insertBotProjectSchema } from "./bot-projects";
export type { BotProject, InsertBotProject } from "./bot-projects";

// ... и так далее для всех таблиц
```

### Пример использования

```typescript
import { botProjects, type BotProject } from '@/shared/schema/tables';

// Работа с типом
const project: BotProject = {
  id: 1,
  name: 'My Bot',
  // ...
};

// Работа со схемой
const insertSchema = insertBotProjectSchema.parse(data);
```

### Экспорт типов из layout

```typescript
// client/components/layout/index.ts
export type { LayoutConfig } from './layout-manager';

// Использование
import type { LayoutConfig } from '@/components/layout';
```

---

## 🚀 Установка

### Обновление с v2.0.0:

```bash
# Обновите проект
git pull origin main

# Установите зависимости
cd client
npm install

# Соберите проект
npm run build

# Запустите
npm run start
```

### Через Docker:

```bash
# Пересоберите образ
docker-compose build --no-cache

# Запустите
docker-compose up -d
```

---

## ⚠️ Важные замечания

### Миграции базы данных

После обновления рекомендуется проверить миграции базы данных:

```bash
# Проверка состояния миграций
npm run db:check

# Применение миграций (если требуется)
npm run db:migrate
```

### Обратная совместимость

- Все изменения обратно совместимы
- Старые данные сохранятся при обновлении
- Новые поля добавлены с значениями по умолчанию

---

## 📦 Зависимости

Новые зависимости не требуются.

---

## 🔗 Ссылки

- [Исходный код релиза](https://github.com/fedorabakumets/telegram-bot-builder/tree/v2.0.1)
- [Сравнение изменений](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.0...v2.0.1)
- [Полный список коммитов](https://github.com/fedorabakumets/telegram-bot-builder/commits/v2.0.1)

---

## 📋 Чек-лист обновления

- [x] Схема разделена на модули
- [x] Добавлена JSDoc документация
- [x] Новые поля в botProjects для Google Sheets
- [x] Новые поля avatarUrl в userBotData и botUsers
- [x] Обновлена версия до 2.0.1
- [x] Исправлен импорт LayoutConfig
- [x] Создан index.ts для экспорта типов layout

---

**Полный список изменений:** [Коммиты v2.0.0...v2.0.1](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.0...v2.0.1)
