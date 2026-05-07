# Анализ заказа: Telegram-бот с воронкой и реферальной системой

## Исходный запрос

> Задача: Разработать Telegram-бота с воронкой, реферальной системой и сбором базы.
> Только код (Python / Node.js и т.д.), без использования конструкторов.

### Логика воронки

- Вход по ссылке (`/start=ref_id`)
- Воронка по аналогии с https://t.me/Crypto_Alex_Bot?start=adv_kor:
  - вход: `/start=ref_id`
  - отправка видеосообщения с CTA на подписку
  - кнопки: «Подписаться» / «Проверить подписку»
  - автопроверка подписки на канал — не подписан → повтор — подписан → следующий шаг
  - финал: сообщение + меню (4 кнопки)

### Реферальная система

- Поддержка `ref_id` в ссылках
- Фиксация источника при первом входе
- Учёт переходов
- Учёт подписок

### Сбор базы

- Telegram ID
- username
- дата входа
- ref_id

### Админ-функции

- Статистика по рефералам
- Общее количество пользователей
- Выгрузка базы

### Критичные требования

- Нет дублей пользователей
- Корректная проверка подписки
- Корректная работа по всем ссылкам
- Повторные заходы не ломают логику
- Без потерь рефералов

---

## Что реализовано на конструкторе

Проект: `bots/новый_бот_2_239_151/project.json`

| Требование | Статус | Реализация |
|---|---|---|
| Вход по ссылке `/start=ref_id` | ✅ | `command_trigger` с `deepLinkParam: "ref_"`, `deepLinkMatchMode: "startsWith"` |
| Фиксация источника при первом входе | ✅ | `deepLinkSaveToVar: true`, `deepLinkVarName: "referrer_id"` — пишется в `bot_users.deep_link_param` с COALESCE |
| Учёт переходов | ✅ | Каждый новый пользователь с `ref_id` записывается в таблицу `bot_users` |
| Нет дублей пользователей | ✅ | Встроено в генератор — `ON CONFLICT DO UPDATE` с COALESCE |
| Повторные заходы не ломают логику | ✅ | COALESCE не перезаписывает `referrer_id` при повторном `/start` |
| Без потерь рефералов | ✅ | Реферал фиксируется до любой логики воронки |
| Проверка подписки на канал | ✅ | `condition`-узел с оператором `is_subscribed: @sonofbog` через `bot.get_chat_member()` |
| Повтор если не подписан | ✅ | Ветка `else` → `msg-not-subscribed` → петля обратно на `check-subscription` |
| Финальное меню 4 кнопки | ✅ | `keyboard`-узел с `keyboardType: "reply"`, 4 кнопки разделов |
| Сбор базы (ID, username, дата, ref_id) | ✅ | Автоматически в таблицу `bot_users` при каждом `/start` |
| Fallback `/start` без реферала | ✅ | Второй `command_trigger` без `deepLinkParam` → та же воронка |

### Граф сценария

```
/start?ref_xxx  →  trigger-start (deepLink → referrer_id)  ─┐
/start          →  PF6Zj00y9kIH7wMtPw2_U                   ─┤
                                                              ↓
                                                   check-subscription
                                                   (is_subscribed @sonofbog)
                                                    ↓               ↓
                                               msg-final      msg-not-subscribed
                                               + keyboard      + keyboard
                                               (4 reply)       (Подписаться /
                                                                Проверить ↺)
```

---

## Что осталось (не покрывается конструктором)

| Требование | Статус | Причина |
|---|---|---|
| Учёт подписок по рефералам (счётчик) | ❌ | Конструктор не фиксирует момент подписки в отдельный счётчик. Нужен HTTP-запрос на бэкенд в ветке `is_subscribed` |
| Статистика по рефералам (`/stats`) | ❌ | Нет встроенной команды для просмотра статистики в разрезе `ref_id` |
| Общее количество пользователей | ❌ | Нет встроенной команды `/stats` для администратора |
| Выгрузка базы в CSV | ❌ | Нет встроенной команды `/export` |

---

## Варианты закрытия остатка

### Вариант A — HTTP-узел + внешний бэкенд
Добавить в ветку `is_subscribed` узел `http_request`:
```
check-subscription (is_subscribed)
  → http_request POST /api/referral/subscribed?user_id={user_id}&ref_id={referrer_id}
  → msg-final
```
Бэкенд инкрементирует счётчик подписок. Статистика и выгрузка — через отдельный API.

**Объём:** ~4–6 часов (бэкенд на Python/Node.js + 1 HTTP-узел в конструкторе)

### Вариант B — Отдельный лист «Админка» в конструкторе
Добавить лист с командой `/stats` для администратора:
- `command_trigger /stats` → `http_request GET /api/admin/stats` → `message {response}`
- `command_trigger /export` → `http_request GET /api/admin/export` → отправка файла

**Объём:** ~2–3 часа (бэкенд-эндпоинты + листы в конструкторе)

### Вариант C — Полностью кастомный код
Написать бота с нуля на Python (aiogram 3) без конструктора.

**Объём:** ~20–30 часов

---

## Итог

Конструктор покрывает **~85% заказа**. Остаток — счётчик подписок и админ-функции — закрывается через HTTP-узлы + минимальный бэкенд (Вариант A+B, ~6–9 часов).

---

## Standalone-поставка (Docker без платформы)

Когда заказчик получает только папку с кодом, инициализацию БД нужно добавить в саму папку бота — платформа (`server/database/init-db.ts`) в этом случае не участвует.

### Что нужно добавить в папку бота

**`docker-compose.yml`** — поднимает всё одной командой:
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: botdb
      POSTGRES_USER: bot
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bot -d botdb"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    # опционально — нужен только при webhook-режиме

  bot:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    env_file: .env
```

**`init_db.py`** — урезанная версия `server/database/init-db.ts`, только нужные таблицы:
- `bot_users` — пользователи с `deep_link_param`, `referrer_id`, `registered_at`
- `user_bot_data` — переменные пользователя (FSM через PostgresStorage)
- `bot_messages` — история сообщений (опционально)

Запускается один раз перед стартом через entrypoint:
```dockerfile
CMD ["sh", "-c", "python init_db.py && python bot.py"]
```

**`.env.example`** — добавить переменные:
```
DATABASE_URL=postgresql://bot:password@postgres:5432/botdb
REDIS_URL=redis://redis:6379
BOT_TOKEN=
ADMIN_IDS=
PROJECT_ID=1
TOKEN_ID=1
```

### Redis — обязателен или нет?

| Режим | Redis |
|---|---|
| Polling (стандартный) | ❌ не нужен — FSM живёт в PostgreSQL через `PostgresStorage` |
| Webhook | ✅ обязателен — FSM должен жить между апдейтами разных процессов |

Для большинства заказчиков polling достаточен → **минимальная поставка: только PostgreSQL + бот**.
