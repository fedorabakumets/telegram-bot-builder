# План новых фич кнопок для Telegram бот-редактора

> Дата обновления: 4 апреля 2026  
> Актуальная версия Bot API: **9.6** (3 апреля 2026)

---

## Введение

В данном документе описаны новые типы кнопок и параметры клавиатур Telegram, которые ещё не реализованы в редакторе.
Фичи сгруппированы по приоритету. Самые свежие возможности из Bot API 9.4 (`style`, `icon_custom_emoji_id`) выделены как **приоритетные**.

Уже реализовано и **не входит** в этот план: `goto`, `url`, `contact`, `location`, `copy_text`, `web_app`, `command`, `selection`, `complete`, `default`, `hideAfterClick`, `customCallbackData`, `style`.

---

## ✅ Реализовано

### `style` — цвет кнопки (Bot API 9.4)

**Реализовано:** 4 апреля 2026 | **Требует:** aiogram >= 3.27.0

Правильные значения (aiogram 3.27.0):
- `"primary"` — синий
- `"success"` — зелёный
- `"danger"` — красный

> ⚠️ Значения в документации Telegram (`secondary`, `destructive`) отличаются от aiogram. Используй значения aiogram.

---

## 🔴 Приоритет 1 — Bot API 9.4 (февраль 2026)

### 1.1 `style` — цвет кнопки

~~**Bot API:** 9.4 | **Тип:** inline + reply | **Сложность:** Средняя | **Ценность:** Высокая~~

✅ **Реализовано** — см. секцию выше.

---

### 1.2 `icon_custom_emoji_id` — кастомный эмодзи на кнопке

**Bot API:** 9.4 | **Тип:** inline + reply | **Сложность:** Средняя | **Ценность:** Высокая

Позволяет отображать кастомный эмодзи (из Telegram Premium стикерпаков) на кнопке вместо или рядом с текстом.
Требует Premium-подписки у бота или наличия прав на использование эмодзи.

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton

btn = InlineKeyboardButton(
    text="Настройки",
    callback_data="settings",
    icon_custom_emoji_id="5368324170671202286"  # ID кастомного эмодзи
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `iconCustomEmojiId: z.string().optional()`
- `lib/bot-generator/types/button-types.ts` — добавить поле в тип `Button`
- `lib/templates/keyboard/keyboard.py.jinja2` — добавить `icon_custom_emoji_id="{{ btn.iconCustomEmojiId }}"` при наличии
- `client/components/editor/properties/components/button-card/button-card.tsx` — поле ввода ID эмодзи
- `client/components/editor/canvas/canvas-node/inline-button.tsx` — отображение эмодзи в превью

---

## 🟠 Приоритет 2 — Inline режим (Bot API 2.0–6.7)

### 2.1 `switch_inline_query` — переключение в inline режим с выбором чата

**Bot API:** 2.0 (апрель 2016) | **Тип:** только inline | **Сложность:** Низкая | **Ценность:** Средняя

При нажатии открывает диалог выбора чата и вставляет `@bot_username <query>` в поле ввода.
Пользователь сам выбирает, в каком чате использовать inline-режим бота.

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton

btn = InlineKeyboardButton(
    text="Поделиться",
    switch_inline_query="поиск товара"
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'switch_inline_query'`, поле `switchInlineQuery: z.string().optional()`
- `lib/bot-generator/types/button-types.ts` — добавить `'switch_inline_query'` в `ButtonAction`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка `elif btn.action == 'switch_inline_query'`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-action-selector.tsx` — добавить в список

---

### 2.2 `switch_inline_query_current_chat` — inline режим в текущем чате

**Bot API:** 6.1 (июнь 2022) | **Тип:** только inline | **Сложность:** Низкая | **Ценность:** Средняя

Аналог `switch_inline_query`, но переключает inline-режим прямо в текущем чате без выбора.
Удобно для быстрого поиска или фильтрации контента внутри диалога.

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton

btn = InlineKeyboardButton(
    text="Найти здесь",
    switch_inline_query_current_chat="категория:"
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `switchInlineQueryCurrentChat: z.string().optional()`
- `lib/bot-generator/types/button-types.ts` — добавить `'switch_inline_query_current_chat'` в `ButtonAction`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка `elif btn.action == 'switch_inline_query_current_chat'`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-action-selector.tsx` — добавить в список

---

### 2.3 `switch_inline_query_chosen_chat` — inline режим с выбором типа чата

**Bot API:** 6.7 (апрель 2023) | **Тип:** только inline | **Сложность:** Средняя | **Ценность:** Средняя

Расширенная версия `switch_inline_query` с фильтрацией типов чатов.
Можно разрешить только личные чаты, группы, каналы или ботов.

**Объект `SwitchInlineQueryChosenChat`:**
```python
# allow_user_chats — личные чаты
# allow_bot_chats — чаты с ботами
# allow_group_chats — группы и супергруппы
# allow_channel_chats — каналы
```

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton, SwitchInlineQueryChosenChat

btn = InlineKeyboardButton(
    text="Отправить в канал",
    switch_inline_query_chosen_chat=SwitchInlineQueryChosenChat(
        query="шаблон",
        allow_channel_chats=True
    )
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `switchInlineQueryChosenChat` с вложенными флагами
- `lib/bot-generator/types/button-types.ts` — добавить интерфейс `SwitchInlineQueryChosenChatConfig`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `SwitchInlineQueryChosenChat(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `SwitchInlineQueryChosenChat`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-card.tsx` — чекбоксы для типов чатов

---

## 🟡 Приоритет 3 — Специальные inline кнопки

### 3.1 `login_url` — авторизация через Telegram Login Widget

**Bot API:** 4.3 (май 2019) | **Тип:** только inline | **Сложность:** Высокая | **Ценность:** Средняя

Кнопка открывает страницу авторизации через Telegram Login Widget.
После авторизации пользователь перенаправляется на указанный URL с данными Telegram.
Требует настройки домена в BotFather (`/setdomain`).

**Объект `LoginUrl`:**
- `url` — HTTPS URL страницы авторизации
- `forward_text` — текст кнопки после авторизации (опционально)
- `bot_username` — имя бота для авторизации (опционально)
- `request_write_access` — запросить разрешение на отправку сообщений (опционально)

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton, LoginUrl

btn = InlineKeyboardButton(
    text="Войти через Telegram",
    login_url=LoginUrl(
        url="https://example.com/auth",
        forward_text="Вы авторизованы",
        request_write_access=True
    )
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'login_url'`, объект `loginUrl`
- `lib/bot-generator/types/button-types.ts` — добавить интерфейс `LoginUrlConfig`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `LoginUrl(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `LoginUrl`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-card.tsx` — поля URL, forward_text, флаг write_access

---

### 3.2 `pay` — кнопка оплаты

**Bot API:** 3.0 (май 2017) | **Тип:** только inline | **Сложность:** Средняя | **Ценность:** Высокая

Специальная кнопка для оплаты в invoice-сообщениях. Должна быть **первой кнопкой** в первом ряду.
Работает только в сообщениях типа invoice (счёт на оплату).

**Пример (aiogram):**
```python
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

kb = InlineKeyboardMarkup(inline_keyboard=[[
    InlineKeyboardButton(text="💳 Оплатить 500₽", pay=True)
]])
# Используется только с bot.send_invoice(...)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'pay'`, флаг `pay: z.boolean().optional()`
- `lib/bot-generator/types/button-types.ts` — добавить `'pay'` в `ButtonAction`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка `elif btn.action == 'pay'` с `pay=True`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-action-selector.tsx` — добавить в список (только для invoice-узлов)

---

## 🟢 Приоритет 4 — Reply клавиатуры (Bot API 4.6–6.5)

### 4.1 `request_users` — запрос пользователей

**Bot API:** 6.5 (декабрь 2022) | **Тип:** только reply | **Сложность:** Средняя | **Ценность:** Средняя

Кнопка открывает диалог выбора пользователей из контактов. Бот получает их данные через `UsersShared`.

**Объект `KeyboardButtonRequestUsers`:**
- `request_id` — уникальный ID запроса (число)
- `user_is_bot` — только боты / только люди (опционально)
- `user_is_premium` — только Premium пользователи (опционально)
- `max_quantity` — максимальное количество (1–10, по умолчанию 1)
- `request_name`, `request_username`, `request_photo` — запросить доп. данные

**Пример (aiogram):**
```python
from aiogram.types import KeyboardButton, KeyboardButtonRequestUsers

btn = KeyboardButton(
    text="Выбрать пользователя",
    request_users=KeyboardButtonRequestUsers(
        request_id=1,
        max_quantity=3,
        request_name=True
    )
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'request_users'`, объект `requestUsers`
- `lib/bot-generator/types/button-types.ts` — добавить интерфейс `RequestUsersConfig`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `KeyboardButtonRequestUsers(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `KeyboardButtonRequestUsers`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-card.tsx` — настройки фильтров

---

### 4.2 `request_chat` — запрос чата

**Bot API:** 6.5 (декабрь 2022) | **Тип:** только reply | **Сложность:** Средняя | **Ценность:** Средняя

Кнопка открывает диалог выбора чата (группы или канала). Бот получает данные через `ChatShared`.

**Объект `KeyboardButtonRequestChat`:**
- `request_id` — уникальный ID запроса
- `chat_is_channel` — `True` для каналов, `False` для групп
- `chat_is_forum` — только форумы (опционально)
- `chat_has_username` — только публичные чаты (опционально)
- `chat_is_created` — только созданные пользователем (опционально)
- `bot_is_member` — бот должен быть участником (опционально)
- `request_title`, `request_username`, `request_photo` — запросить доп. данные

**Пример (aiogram):**
```python
from aiogram.types import KeyboardButton, KeyboardButtonRequestChat

btn = KeyboardButton(
    text="Выбрать канал",
    request_chat=KeyboardButtonRequestChat(
        request_id=2,
        chat_is_channel=True,
        request_title=True
    )
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'request_chat'`, объект `requestChat`
- `lib/bot-generator/types/button-types.ts` — добавить интерфейс `RequestChatConfig`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `KeyboardButtonRequestChat(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `KeyboardButtonRequestChat`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция
- `client/components/editor/properties/components/button-card/button-card.tsx` — настройки фильтров

---

### 4.3 `request_poll` — запрос создания опроса

**Bot API:** 4.6 (январь 2020) | **Тип:** только reply | **Сложность:** Низкая | **Ценность:** Низкая

Кнопка предлагает пользователю создать и отправить опрос в чат.
Можно ограничить тип: только обычный опрос или только викторина.

**Объект `KeyboardButtonPollType`:**
- `type` — `"quiz"` (викторина), `"regular"` (обычный), или пусто (любой)

**Пример (aiogram):**
```python
from aiogram.types import KeyboardButton, KeyboardButtonPollType

btn = KeyboardButton(
    text="Создать опрос",
    request_poll=KeyboardButtonPollType(type="regular")
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'request_poll'`, `pollType: z.enum(['quiz', 'regular', '']).optional()`
- `lib/bot-generator/types/button-types.ts` — добавить `'request_poll'` в `ButtonAction`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `KeyboardButtonPollType(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `KeyboardButtonPollType`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция

---

### 4.4 `is_persistent` — постоянная клавиатура

**Bot API:** 6.4 (август 2022) | **Тип:** только reply (параметр `ReplyKeyboardMarkup`) | **Сложность:** Низкая | **Ценность:** Средняя

Параметр клавиатуры (не отдельная кнопка). Если `True` — клавиатура остаётся видимой даже когда поле ввода свёрнуто.
По умолчанию Telegram скрывает reply-клавиатуру при сворачивании.

**Пример (aiogram):**
```python
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

kb = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text="Меню")]],
    resize_keyboard=True,
    is_persistent=True  # Клавиатура всегда видна
)
```

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `isPersistent: z.boolean().optional()` на уровне узла/клавиатуры
- `lib/templates/keyboard/keyboard.py.jinja2` — добавить `is_persistent={{ isPersistent | to_python_boolean }}` в `as_markup()`
- `client/components/editor/properties/components/button-card/button-card.tsx` — чекбокс в настройках reply-клавиатуры

---

## 🔵 Приоритет 5 — Bot API 9.6 (апрель 2026)

### 5.1 `request_managed_bot` — запрос создания управляемого бота

**Bot API:** 9.6 (3 апреля 2026) | **Тип:** только reply | **Сложность:** Высокая | **Ценность:** Низкая

Новейшая функция. Кнопка предлагает пользователю создать нового управляемого бота через Telegram.
Бот-родитель получает уведомление и может управлять дочерним ботом.

**Объект `KeyboardButtonRequestManagedBot`:**
- `request_id` — уникальный ID запроса

**Пример (aiogram):**
```python
from aiogram.types import KeyboardButton, KeyboardButtonRequestManagedBot

btn = KeyboardButton(
    text="Создать бота",
    request_managed_bot=KeyboardButtonRequestManagedBot(request_id=10)
)
```

> ⚠️ Функция очень новая (Bot API 9.6, апрель 2026). Поддержка в aiogram может отсутствовать.
> Рекомендуется отложить реализацию до появления стабильной поддержки в библиотеке.

**Затронутые файлы:**
- `shared/schema/tables/button-schema.ts` — добавить `action: 'request_managed_bot'`, объект `requestManagedBot`
- `lib/bot-generator/types/button-types.ts` — добавить интерфейс `RequestManagedBotConfig`
- `lib/templates/keyboard/keyboard.py.jinja2` — ветка с генерацией `KeyboardButtonRequestManagedBot(...)`
- `lib/templates/imports/imports.py.jinja2` — добавить импорт `KeyboardButtonRequestManagedBot`
- `client/components/editor/properties/components/button-card/button-action-options.tsx` — новая опция

---

## Таблица приоритетов

| # | Фича | Bot API | Тип | Сложность | Ценность | Приоритет |
|---|------|---------|-----|-----------|----------|-----------|
| 1 | `style` — цвет кнопки | 9.4 | inline + reply | Средняя | **Высокая** | ✅ Готово |
| 2 | `icon_custom_emoji_id` — эмодзи | 9.4 | inline + reply | Средняя | **Высокая** | 🔴 1 |
| 3 | `switch_inline_query` | 2.0 | inline | Низкая | Средняя | 🟠 2 |
| 4 | `switch_inline_query_current_chat` | 6.1 | inline | Низкая | Средняя | 🟠 2 |
| 5 | `switch_inline_query_chosen_chat` | 6.7 | inline | Средняя | Средняя | 🟠 2 |
| 6 | `pay` — оплата | 3.0 | inline | Средняя | **Высокая** | 🟡 3 |
| 7 | `login_url` — авторизация | 4.3 | inline | Высокая | Средняя | 🟡 3 |
| 8 | `request_users` — запрос юзеров | 6.5 | reply | Средняя | Средняя | 🟢 4 |
| 9 | `request_chat` — запрос чата | 6.5 | reply | Средняя | Средняя | 🟢 4 |
| 10 | `is_persistent` — постоянная клавиатура | 6.4 | reply | Низкая | Средняя | 🟢 4 |
| 11 | `request_poll` — запрос опроса | 4.6 | reply | Низкая | Низкая | 🟢 4 |
| 12 | `request_managed_bot` | 9.6 | reply | Высокая | Низкая | 🔵 5 |

---

## Рекомендуемый порядок реализации

1. **`style` + `icon_custom_emoji_id`** — самые свежие и визуально заметные фичи (Bot API 9.4)
2. **`switch_inline_query*`** — три варианта inline-переключения, реализуются по одному паттерну
3. **`pay`** — высокая ценность для монетизации ботов
4. **`login_url`** — сложная, но востребованная для авторизации
5. **`request_users` + `request_chat`** — парные фичи одного Bot API, реализуются вместе
6. **`is_persistent`** — простой параметр клавиатуры
7. **`request_poll`** — низкий приоритет
8. **`request_managed_bot`** — ждать стабилизации aiogram поддержки
