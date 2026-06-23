<!--
 * @fileoverview Setup Wizard и хранение настроек приложения в PostgreSQL
 * @module docs/futures/setup-wizard-app-settings
 -->

# Setup Wizard + хранение настроек приложения в PostgreSQL

## 1. Проблема

Сейчас `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET` и `VITE_TELEGRAM_BOT_USERNAME` читаются
напрямую из `process.env` в `server/routes/auth/handlers/configHandler.ts`.

Это создаёт три проблемы:

- **Сложность деплоя** — администратор должен знать где взять значения в BotFather, как
  правильно назвать переменные и перезапустить сервер после изменений.
- **Нет UI** — изменить настройки без доступа к серверу и редеплоя невозможно.
- **Нет валидации** — сервер стартует с пустыми значениями и молча ломает авторизацию.

---

## 2. Решение — Setup Wizard

Флоу первого запуска:

```
Первый запуск
    ↓
GET /api/setup/status → { configured: false }
    ↓
AuthGuard / middleware → редирект на /setup
    ↓
Страница /setup — форма + инструкция по BotFather
    ↓
POST /api/setup → сохранение в app_settings
    ↓
Редирект на /projects
```

Флоу повторного запуска:

```
Повторный запуск
    ↓
GET /api/setup/status → { configured: true }
    ↓
/setup → редирект на /projects (недоступна)
```

---

## 3. Схема БД — таблица `app_settings`

**Файл:** `shared/schema/tables/app-settings.ts`

```ts
/**
 * @fileoverview Таблица настроек приложения (ключ-значение)
 * @module shared/schema/tables/app-settings
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Таблица настроек приложения в формате ключ-значение.
 * Хранит конфигурацию, которую администратор задаёт через UI.
 */
export const appSettings = pgTable("app_settings", {
  /** Уникальный ключ настройки (PRIMARY KEY) */
  key: text("key").primaryKey(),
  /** Значение настройки в виде строки */
  value: text("value").notNull(),
  /** Дата последнего обновления */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Тип записи настройки */
export type AppSetting = typeof appSettings.$inferSelect;
```

Обязательные ключи:

| Ключ                      | Описание                                    |
|---------------------------|---------------------------------------------|
| `telegram_client_id`      | Числовой Client ID из BotFather             |
| `telegram_client_secret`  | Client Secret из BotFather → Web Login      |
| `telegram_bot_username`   | Имя бота без `@` (например: `mybotname`)    |

Добавить в `shared/schema/tables/index.ts`:

```ts
export { appSettings } from "./app-settings";
```

---

## 4. Серверная часть

### 4.1 Сервис настроек

**Файл:** `server/services/app-settings.service.ts`

```ts
/**
 * @fileoverview Сервис для работы с настройками приложения
 * @module server/services/app-settings.service
 */

/** In-memory кэш с TTL 60 секунд */
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Получить значение настройки по ключу.
 * Сначала проверяет кэш, затем БД, затем process.env (fallback).
 * @param key - Ключ настройки
 * @returns Значение или undefined
 */
export async function getSetting(key: string): Promise<string | undefined> { ... }

/**
 * Сохранить или обновить настройку в БД и сбросить кэш.
 * @param key - Ключ настройки
 * @param value - Значение настройки
 */
export async function setSetting(key: string, value: string): Promise<void> { ... }

/**
 * Получить все настройки из БД одним запросом.
 * @returns Объект вида { key: value }
 */
export async function getAllSettings(): Promise<Record<string, string>> { ... }

/**
 * Проверить, настроены ли все обязательные ключи.
 * @returns true если все три ключа присутствуют
 */
export async function isConfigured(): Promise<boolean> { ... }
```

Кэш сбрасывается при каждом вызове `setSetting`. `isConfigured` проверяет наличие
`telegram_client_id`, `telegram_client_secret`, `telegram_bot_username`.

### 4.2 Обновление configHandler

**Файл:** `server/routes/auth/handlers/configHandler.ts`

Заменить прямое чтение `process.env` на вызов сервиса:

```ts
import { getSetting } from "@/services/app-settings.service";

export async function handlePublicConfig(_req: Request, res: Response): Promise<void> {
  const clientId = await getSetting("telegram_client_id");
  const botUsername = await getSetting("telegram_bot_username");

  res.json({
    telegramClientId: Number(clientId) || 0,
    telegramBotUsername: botUsername || "",
  });
}
```

Хендлер становится `async`. Обновить регистрацию роута в `server/routes/auth/index.ts`.

### 4.3 Роут POST /api/setup

**Файл:** `server/routes/setup/index.ts`

```
POST /api/setup          — сохранить настройки (только если ещё не настроено)
GET  /api/setup/status   — вернуть { configured: boolean }
```

`POST /api/setup` возвращает `409 Conflict` если настройки уже заданы — повторная
инициализация через этот эндпоинт невозможна (для изменений будет `/admin/settings`).

Тело запроса:

```ts
interface SetupPayload {
  /** Числовой Client ID из BotFather */
  telegramClientId: string;
  /** Client Secret из BotFather */
  telegramClientSecret: string;
  /** Имя бота без @ */
  telegramBotUsername: string;
}
```

### 4.4 Middleware setup-guard

**Файл:** `server/middleware/setup-guard.ts`

```ts
/**
 * @fileoverview Middleware проверки первоначальной настройки приложения
 * @module server/middleware/setup-guard
 */

/**
 * Проверяет, настроены ли обязательные ключи приложения.
 * Если нет — возвращает 503 с телом { setupRequired: true }.
 * Клиент перехватывает этот статус и редиректит на /setup.
 */
export async function setupGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> { ... }
```

Middleware применяется ко всем роутам кроме `/api/setup` и `/api/auth/config`.

---

## 5. Клиентская часть

### 5.1 Страница /setup

**Файл:** `client/pages/setup.tsx`

Форма с тремя полями:

| Поле                | Placeholder              | Тип      |
|---------------------|--------------------------|----------|
| Telegram Client ID  | `123456789`              | `number` |
| Client Secret       | `abc123...`              | `text`   |
| Bot Username        | `mybotname` (без `@`)    | `text`   |

Рядом с формой — компонент `SetupInstructions` с пошаговой инструкцией.
После успешного `POST /api/setup` — редирект на `/projects` через `useLocation` (wouter).

### 5.2 Роут в App.tsx

```tsx
// В компоненте Router добавить до остальных роутов:
const SetupPage = lazy(() => import("@/pages/setup"));

<Route path="/setup" component={SetupPage} />
```

Роут `/setup` должен быть **вне** `AuthGuard` — пользователь ещё не авторизован
при первом запуске.

### 5.3 Компонент инструкции

**Файл:** `client/components/setup/SetupInstructions.tsx`

Пошаговая инструкция как получить значения в BotFather:

```
1. Откройте @BotFather в Telegram
2. Отправьте /mybots → выберите бота
3. Bot Settings → Web Login → получите Client ID и Client Secret
4. Скопируйте username бота (без @)
```

Компонент оформляется через `shadcn/ui` — `Card` + `Steps` или нумерованный список.

### 5.4 Hook use-setup

**Файл:** `client/hooks/use-setup.ts`

```ts
/**
 * @fileoverview Hook для отправки настроек Setup Wizard
 * @module client/hooks/use-setup
 */

/**
 * Мутация POST /api/setup.
 * @returns useMutation с методом mutate и состоянием isPending/isError
 */
export function useSetup() {
  return useMutation({
    mutationFn: (payload: SetupPayload) =>
      fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => {
        if (!r.ok) throw new Error("Setup failed");
        return r.json();
      }),
  });
}
```

### 5.5 Определение необходимости Setup

`AuthGuard` или отдельный `SetupGuard` на клиенте проверяет `/api/setup/status`
при старте приложения. Если `configured: false` — редиректит на `/setup` вместо
показа экрана авторизации.

---

## 6. Что остаётся в .env (инфраструктура)

Эти переменные не имеют смысла в UI — они нужны до старта приложения или
относятся к инфраструктуре, а не к бизнес-логике:

```dotenv
DATABASE_URL        # строка подключения к PostgreSQL
REDIS_URL           # строка подключения к Redis
PORT                # порт сервера
NODE_ENV            # окружение (development / production)
SESSION_SECRET      # секрет для подписи сессий
TELEGRAM_PROXY_URL  # HTTP-прокси для Telegram API (опционально)
```

---

## 7. Что уходит в БД (настраивается через UI)

| Переменная окружения      | Ключ в app_settings       |
|---------------------------|---------------------------|
| `TELEGRAM_CLIENT_ID`      | `telegram_client_id`      |
| `TELEGRAM_CLIENT_SECRET`  | `telegram_client_secret`  |
| `VITE_TELEGRAM_BOT_USERNAME` | `telegram_bot_username` |

После миграции эти переменные можно убрать из `.env.example` или оставить
с пометкой `# устарело, используется только как fallback`.

---

## 8. Fallback стратегия

Для обратной совместимости с существующими деплоями `getSetting` реализует
следующий порядок поиска:

```
1. In-memory кэш (TTL 60s)
2. Таблица app_settings в PostgreSQL
3. process.env (fallback для старых деплоев)
```

Это означает, что существующие деплои с переменными в `.env` продолжат работать
без изменений. Setup Wizard нужен только при чистой установке.

---

## 9. Порядок реализации

1. **Миграция БД** — создать `shared/schema/tables/app-settings.ts`, добавить в index,
   запустить `drizzle-kit generate` + `migrate`.
2. **Сервис** — реализовать `app-settings.service.ts` с кэшем и fallback.
3. **Роуты** — `GET /api/setup/status` и `POST /api/setup`.
4. **Middleware** — `setup-guard.ts`, подключить в `server/index.ts`.
5. **configHandler** — сделать async, заменить `process.env` на `getSetting`.
6. **Клиент** — `use-setup.ts` → `SetupInstructions.tsx` → `setup.tsx` → роут в `App.tsx`.
7. **SetupGuard на клиенте** — проверка `/api/setup/status` при старте.

---

## 10. Будущее

### Страница /admin/settings
После первоначальной настройки администратор должен иметь возможность изменить
значения без редеплоя. Страница `/admin/settings` с той же формой, но доступная
только авторизованным пользователям с ролью `admin`.

### Поддержка других провайдеров
Таблица `app_settings` в формате ключ-значение легко расширяется:

```
google_client_id
google_client_secret
github_client_id
github_client_secret
```

Каждый провайдер добавляет свои ключи без изменения схемы.

### Шифрование чувствительных значений
`telegram_client_secret` и аналогичные секреты хранить в зашифрованном виде
(AES-256-GCM). Ключ шифрования берётся из `SESSION_SECRET` или отдельной
переменной `ENCRYPTION_KEY`. Расшифровка происходит в `getSetting` прозрачно
для вызывающего кода.

```
app_settings.value = encrypt(plaintext, ENCRYPTION_KEY)
getSetting(key)     → decrypt(value, ENCRYPTION_KEY)
```
