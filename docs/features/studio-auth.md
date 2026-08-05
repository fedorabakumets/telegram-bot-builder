/**
 * @fileoverview Авторизация Studio (вход, сессия, выход, смена аккаунта)
 *
 * Документация UI для людей. Контракт API: `docs/api/auth.md` (генерация через `npm run docs:api`).
 */

# Авторизация Studio

## Обзор

Идентичность пользователя Studio — **Telegram ID**. Классической регистрации email/пароль нет.

Источник правды после загрузки страницы — серверная сессия (`GET /api/auth/me`), не localStorage.

## Вход

| Способ | Когда | Как |
|--------|-------|-----|
| Telegram Login Widget | Production без `SKIP_AUTH` | Кнопка «Войти» → виджет → `POST /api/auth/telegram` (+ `id_token`) |
| Mini App | Открытие внутри Telegram | Автоматически `POST /api/auth/telegram/miniapp` (HMAC initData) |
| Dev / SKIP_AUTH | `NODE_ENV=development` или `SKIP_AUTH=true` | Форма Telegram ID → `POST /api/auth/dev-login` |

После успешного входа: toast «Добро пожаловать…», cookie `connect.sid`, UI-кэш в localStorage.

## Reload страницы

Клиент вызывает только `GET /api/auth/me`. Повторный `POST /api/auth/telegram` **не** выполняется.

Запрос `/me` **дедуплицируется** через React Query (`queryKey: ['/api/auth/me']`, `staleTime: Infinity`): при ~20 mount `useTelegramAuth` на вкладке уходит **один** HTTP-запрос.

## Выход

Кнопка «Выйти» (сайдбар / шапка) → `POST /api/auth/logout` → сессия уничтожена, cookie очищена, toast «Вы вышли из аккаунта».

## Смена аккаунта

Кнопка **«Сменить аккаунт»** (иконка обновления рядом с профилем в сайдбаре и в шапке):

1. Открывается тот же Telegram Login / dev-форма.
2. Клиент шлёт `POST /api/auth/telegram` с новым пользователем.
3. Сервер при другом `id` делает `regenerateSession`, в ответе `switched: true`.
4. Клиент очищает React Query кэш и загружает проекты нового пользователя.
5. Toast: «Вы вошли как {имя}».

Проекты предыдущего пользователя **не** переносятся. Мигрируют только гостевые проекты (`owner_id IS NULL`), привязанные к session id.

Ограничение: один аккаунт на вкладку браузера (одна session cookie).

## Режимы окружения

| Режим | Proof на login/switch | Dev-login |
|-------|----------------------|-----------|
| Development | не обязателен | да |
| `SKIP_AUTH=true` | не обязателен | да |
| Production без SKIP_AUTH | обязателен `id_token` / Mini App HMAC | нет |

## Другие контуры (не Studio login)

- Admin: `/admin/login`
- Agent PAT: Bearer для MCP/CLI
- Google OAuth: Sheets
- Userbot QR: Telethon

## Ops checklist (production)

- [ ] `SESSION_SECRET` задан
- [ ] Telegram Client ID настроен (виджет)
- [ ] `TELEGRAM_BOT_TOKEN` для Mini App
- [ ] `SKIP_AUTH` не выставлен (если нужен строгий Telegram Login)
