/**
 * @fileoverview Чеклист ручной проверки Studio-auth после закрытия пробелов
 */

# QA: Studio auth

Выполнить перед merge / после деплоя.

| # | Сценарий | Ожидание | OK |
|---|----------|----------|----|
| 1 | Telegram Login (prod без SKIP_AUTH) | Cookie `connect.sid`; `GET /api/auth/me` → user | |
| 2 | Reload страницы | В Network только `GET /me`, без `POST /telegram` | |
| 3 | Logout | `GET /me` → `{ user: null }`; AuthScreen | |
| 4 | Смена аккаунта A→B | Проекты A не видны; `/me` = B; новая session | |
| 5 | Mini App | initData login работает (нужен TELEGRAM_BOT_TOKEN) | |
| 6 | SKIP_AUTH / dev-login | Вход по ID без id_token | |
| 7 | Login без id_token в strict prod | 401 | |
| 8 | Rate limit | >5 запросов/мин на `/api/auth/*` → 429 | |
| 9 | Switch без proof в strict prod | 401, сессия A жива | |

Автотесты:

```bash
npm run test:auth
npx vitest run client/components/editor/header/hooks/use-telegram-auth.test.ts
```
