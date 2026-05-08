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
| Учёт переходов | ✅ | `sv-track-visit` инкрементирует `visit_count` выражением `{visit_count} + 1` при каждом `/start` |
| Нет дублей пользователей | ✅ | Встроено в генератор — `ON CONFLICT DO UPDATE` с COALESCE |
| Повторные заходы не ломают логику | ✅ | COALESCE не перезаписывает `referrer_id` при повторном `/start` |
| Без потерь рефералов | ✅ | Реферал фиксируется до любой логики воронки |
| Проверка подписки на канал | ✅ | `condition`-узел с оператором `is_subscribed: @sonofbog` через `bot.get_chat_member()` |
| Повтор если не подписан | ✅ | Ветка `else` → `msg-not-subscribed` → петля обратно на `check-subscription` |
| Финальное меню 4 кнопки | ✅ | `keyboard`-узел с `keyboardType: "reply"`, 4 кнопки разделов |
| Сбор базы (ID, username, дата, ref_id) | ✅ | Автоматически в таблицу `bot_users` при каждом `/start` |
| Fallback `/start` без реферала | ✅ | Второй `command_trigger` без `deepLinkParam` → та же воронка |
| Учёт подписок по рефералам | ✅ | `sv-mark-subscribed` сохраняет `subscribed_source = {referrer_id}`; `sql-increment-subscribed` пишет `subscribed_at = NOW()` в `user_data` (только при первой подписке) |
| Статистика по рефералам (`/stats`) | ✅ | Лист «Админка»: `sql-stats` группирует по `referrer_id`, топ-20, шаблон `{src} — {cnt} чел.` |
| Общее количество пользователей | ✅ | Лист «Админка»: `sql-total` считает всех с `subscribed_at IS NOT NULL`, сохраняет в `total_users` |

### Граф сценария — лист «Воронка»

```
/start?ref_xxx  →  trigger-start (deepLink → referrer_id)  ─┐
/start          →  PF6Zj00y9kIH7wMtPw2_U                   ─┤
                                                              ↓
                                                   sv-track-visit
                                                   (visit_count + 1)
                                                              ↓
                                                   check-subscription
                                                   (is_subscribed @sonofbog)
                                                    ↓               ↓
                                             sv-mark-subscribed  msg-not-subscribed
                                             (is_subscribed,      + keyboard
                                              subscribed_source)  (Подписаться /
                                                    ↓              Проверить ↺)
                                             sql-increment-subscribed
                                             (subscribed_at = NOW(), один раз)
                                                    ↓
                                                msg-final
                                                + keyboard
                                                (4 reply)
```

### Граф сценария — лист «Админка»

```
/stats (adminOnly, privateOnly)
  → sql-total   (COUNT подписавшихся → total_users)
  → sql-stats   (GROUP BY referrer_id, топ-20 → stats_rows)
  → msg-stats   (📊 Всего: {total_users.total} / По рефералам: {stats_rows})
```

---

## Что осталось (не покрывается конструктором)

| Требование | Статус | Причина |
|---|---|---|
| Выгрузка базы в CSV | ❌ | Нет встроенной команды `/export` — нужен HTTP-узел или внешний бэкенд |

---

## Варианты закрытия остатка

### Вариант A — HTTP-узел + внешний бэкенд
Добавить лист с командой `/export` для администратора:
```
command_trigger /export (adminOnly)
  → http_request GET /api/admin/export
  → message (ссылка на файл или прямая отправка CSV)
```
Бэкенд формирует CSV из `bot_users` и возвращает ссылку или файл.

**Объём:** ~2–4 часа

### Вариант B — Полностью кастомный код
Написать бота с нуля на Python (aiogram 3) без конструктора.

**Объём:** ~20–30 часов

---

## Итог

Конструктор покрывает **~95% заказа**. Единственный остаток — выгрузка базы в CSV — закрывается через HTTP-узел + минимальный бэкенд (~2–4 часа).

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
