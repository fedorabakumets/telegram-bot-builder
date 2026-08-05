/**
 * @fileoverview Авторизация и изоляция данных — статус и дальнейшие улучшения
 */

# Авторизация и изоляция данных

UI-док: [`docs/features/studio-auth.md`](../../features/studio-auth.md).  
API: `docs/api/auth.md` (генерируется `npm run docs:api`).

## Реализовано

### GET /api/auth/me + POST /api/auth/logout
- Reload читает сессию через `/me`, не через повторный POST `/telegram`
- **Дедупликация `/me`**: `useAuthMeQuery` + общий `queryKey` — один запрос на вкладку при множественных `useTelegramAuth`; синхронизация между вкладками через `storage` → `setQueryData`
- Logout уничтожает session + clear cookie `connect.sid`
- Алиас: `POST /api/auth/telegram/logout`

### RSA-верификация id_token
Файл: `server/routes/auth/utils/telegramJwks.ts` — полная RSA через JWKS; missing kid / bad sig → reject.
В strict prod (`NODE_ENV=production` и `SKIP_AUTH !== true`) `id_token` обязателен.

### Rate limit `/api/auth/*`
In-memory limiter: 5 req/min на IP (`authRateLimit.ts`).

### Смена аккаунта
Повторный `POST /telegram` с другим id → `regenerateSession`, ответ `switched: true`.
UI: кнопка «Сменить аккаунт». Кэш проектов с `userId` в queryKey.

### getProjectHandler
Уже закрыто middleware `requireProjectAccess` на `GET /api/projects/:id`.

### Toast login / logout / switch
В `use-telegram-auth.ts`.

## Threat model (Studio session)

| Угроза | Защита |
|--------|--------|
| Подделка identity без Telegram | Strict prod: обязателен id_token / Mini App HMAC |
| Слабый JWKS | RSA verify; unknown kid → 401 |
| Logout без destroy | destroySession + clearCookie |
| Session fixation при смене A→B | regenerateSession |
| Утечка проектов A→B в UI | clearUserCache + userId в queryKey |
| Brute-force auth | rate limit 5/min |
| localStorage как truth | `/me` = источник правды |

## Ops checklist (production)

- [ ] `SESSION_SECRET` задан
- [ ] Telegram Client ID (Login Widget)
- [ ] `TELEGRAM_BOT_TOKEN` для Mini App на Railway
- [ ] Не ставить `SKIP_AUTH=true`, если нужен строгий Telegram Login

## Открыто / follow-up

### Блокировка запуска ботов для гостей
AuthGuard уже режет гостей; остаточные guest-пути в canvas-sync — отдельный cleanup.

### Миграция данных гостя при входе
Сейчас мигрируют только проекты. Рассмотреть токены и прочее.

### Гостевой режим (ограничения)
Индикаторы «войдите для…» — низкий приоритет при обязательном AuthGuard.
