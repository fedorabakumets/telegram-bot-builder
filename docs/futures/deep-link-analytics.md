# Deep Link Analytics — Roadmap

## Текущее состояние (Этапы 1-3 ✅)

### Что уже работает:
- ✅ **Deep link routing** — параметры `?start=` корректно обрабатываются
- ✅ **UTM tracking** — `utm_source` записывается при первом касании
- ✅ **Referral система** — `?start=ref_12345` → `referrer_id` сохраняется
- ✅ **Хранение данных** — всё в `user_data` (память) + PostgreSQL (если БД включена)

### Примеры работы:
```
?start=ref_12345   → deep_link_router → msg-ref, referrer_id = "ref_12345"
?start=promo_summer → deep_link_router → msg-promo
?start=unknown     → fallback → msg-default
/start без параметра → start_command_handler → msg-default
```

---

## Этап 4 — Отправка событий на бэкенд (опционально)

### Цель:
Fire-and-forget HTTP запрос на внешний сервер при переходе по реф-ссылке.

### Что отправляется:
```json
{
  "user_id": 123456789,
  "utm_source": "telegram_ref",
  "referrer_id": "ref_12345",
  "timestamp": "2026-05-03T14:30:00Z",
  "bot_username": "my_bot"
}
```

### Требования:
- Эндпоинт на бэкенде (например, `/api/analytics/deep-link`)
- Настройка URL в конфиге бота
- Обработка ошибок (не блокировать основной флоу)

### Зачем:
- Централизованная аналитика для нескольких ботов
- Интеграция с внешними системами (CRM, BI)
- Real-time мониторинг

---

## Этап 5 — Вкладка аналитики в редакторе

### Цель:
Визуализация данных о deep links прямо в UI редактора.

### Что показывать:

#### 1. Источники трафика
```sql
SELECT utm_source, COUNT(*) as users
FROM bot_users
GROUP BY utm_source
ORDER BY users DESC;
```
**UI**: Pie chart или bar chart

#### 2. Реферальная статистика
```sql
SELECT referrer_id, COUNT(*) as referrals
FROM bot_users
WHERE referrer_id IS NOT NULL
GROUP BY referrer_id
ORDER BY referrals DESC
LIMIT 10;
```
**UI**: Таблица топ-10 рефереров

#### 3. Динамика по дням
```sql
SELECT 
  DATE(created_at) as date,
  utm_source,
  COUNT(*) as users
FROM bot_users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date, utm_source
ORDER BY date DESC;
```
**UI**: Line chart с разбивкой по источникам

#### 4. Конверсия deep links
```sql
SELECT 
  COUNT(CASE WHEN utm_source IS NOT NULL THEN 1 END) as deep_link_users,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(CASE WHEN utm_source IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate
FROM bot_users;
```
**UI**: Метрика с процентом

### Технические детали:

#### Бэкенд:
- Новый эндпоинт `/api/bots/:botId/analytics/deep-links`
- Параметры: `?period=7d|30d|90d|all`
- Кэширование результатов (Redis или in-memory)

#### Фронтенд:
- Новая вкладка "Analytics" в BotCard
- Библиотека для графиков: recharts или chart.js
- Автообновление каждые 5 минут

### Ограничения:
- ⚠️ Данные доступны только для ботов с включённой PostgreSQL
- ⚠️ Исторические данные — только с момента включения БД

---

## Альтернативный подход (без этапа 4)

### Можно сделать этап 5 сразу:
Читать данные напрямую из PostgreSQL бота, без отправки на внешний бэкенд.

**Плюсы:**
- Проще реализация
- Не нужен дополнительный эндпоинт
- Данные уже есть в `bot_users`

**Минусы:**
- Нет централизованной аналитики
- Нет real-time событий
- Только для ботов с БД

---

## Дополнительные фичи (вне основного roadmap)

### 1. Генерация реф-ссылки в боте
Кнопка которая отправляет пользователю его персональную ссылку:
```
t.me/my_bot?start=ref_123456789
```

**Реализация:**
- Новый message node с inline кнопкой "Получить реф-ссылку"
- Переменная `{bot_username}` + `{user_id}`
- Копирование в буфер обмена

### 2. Валидация `deepLinkParam` на фронтенде
**Правила:**
- Только `a-z`, `A-Z`, `0-9`, `_`, `-`
- Максимум 64 символа
- Не может начинаться с `_` или `-`

**Где:**
- В форме создания deep link router
- В форме редактирования message node

### 3. Обновление тестов
**Что сломалось:**
- Блок P/Q/R в `test-phase6-keyboard.ts` проверяет старое поведение `start_command_handler`
- Нужно обновить под новую архитектуру с `deep_link_router`

---

## Приоритизация

### High Priority:
1. ✅ Deep link routing (готово)
2. ✅ UTM tracking (готово)
3. ✅ Referral система (готово)

### Medium Priority:
4. Вкладка аналитики (этап 5) — **можно делать сейчас**
5. Валидация на фронтенде
6. Обновление тестов

### Low Priority:
7. Отправка событий на бэкенд (этап 4)
8. Генерация реф-ссылки в боте
9. Расширенная аналитика (когорты, воронки)

---

## Решение

**Рекомендация:** Делать этап 5 (аналитика) без этапа 4 (бэкенд события).

**Почему:**
- Данные уже есть в БД
- Быстрая реализация
- Сразу видимая ценность для пользователей
- Этап 4 можно добавить позже если понадобится
