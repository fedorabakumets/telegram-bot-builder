# Фича: incoming_callback_trigger

> Дата создания: 4 апреля 2026

---

## Описание

Новый тип узла `incoming_callback_trigger` — глобальный перехватчик всех нажатий инлайн-кнопок.

В отличие от `callback_trigger` (который слушает конкретный `callback_data`), этот триггер срабатывает на **любое** нажатие инлайн-кнопки пользователем и работает **параллельно** с основным потоком — не прерывает его.

---

## Сценарии использования

- Уведомить администратора о нажатии кнопки: `"Пользователь {user_name} нажал {button_text}"`
- Логировать все нажатия кнопок
- Считать аналитику по кнопкам
- Пересылать информацию о действии пользователя в другой чат
- Условная реакция: если нажата кнопка с определённым текстом — выполнить действие

---

## Отличие от существующих триггеров

| Триггер | Срабатывает на | Прерывает поток |
|---------|---------------|-----------------|
| `callback_trigger` | Конкретный `callback_data` (exact/startswith) | Да — заменяет обработку |
| `incoming_callback_trigger` | Любое нажатие кнопки | Нет — параллельно |
| `incoming_message_trigger` | Любое текстовое сообщение | Нет — параллельно |

---

## Доступные переменные внутри триггера

- `{callback_data}` — значение `callback_data` нажатой кнопки
- `{button_text}` — текст нажатой кнопки
- `{user_name}`, `{user_id}`, `{first_name}` — данные пользователя

---

## Настройки узла

- Нет обязательных настроек — срабатывает на все нажатия
- Опционально: фильтр по `callback_data` (contains/startswith) — чтобы реагировать только на определённые кнопки

---

## Пример графа

```
[incoming_callback_trigger]
        ↓
[message: "Пользователь {user_name} нажал кнопку {button_text}"]
  получатель: admin_ids
```

```
[incoming_callback_trigger]
        ↓
[condition: button_text содержит "купить"]
        ↓ да
[message: "Новый интерес к покупке от {user_name}"]
  получатель: admin_ids
```

---

## Архитектура реализации

### Принцип работы в Python

Аналогично `incoming_message_trigger` — регистрируется как middleware или отдельный `@dp.callback_query()` обработчик без фильтра, который вызывается ДО основных обработчиков и не прерывает их.

```python
@dp.callback_query()
async def incoming_callback_trigger_handler(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    callback_data = callback_query.data or ""
    button_text = ""  # читается из reply_markup
    # ... выполняем действие (пересылка, уведомление)
    # НЕ вызываем callback_query.answer() — это делает основной обработчик
```

### Порядок регистрации

Важно: `incoming_callback_trigger` должен регистрироваться **после** явных `@dp.callback_query(lambda c: c.data == "...")` обработчиков, чтобы не перехватывать их.

---

## Файлы для создания/обновления

### Схема данных

| Файл | Тип | Изменение |
|------|-----|-----------|
| `shared/schema/tables/node-schema.ts` | Изменение | Добавить `'incoming_callback_trigger'` в enum типов |

### Бэкенд — новые файлы

| Файл | Объём | Описание |
|------|-------|---------|
| `lib/templates/incoming-callback-trigger/index.ts` | ~15 строк | Экспорты модуля |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.params.ts` | ~25 строк | Интерфейсы `IncomingCallbackTriggerEntry` и `IncomingCallbackTriggerTemplateParams` |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.schema.ts` | ~20 строк | Zod-схема валидации |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.renderer.ts` | ~80 строк | `collectIncomingCallbackTriggerEntries`, `generateIncomingCallbackTriggers`, `generateIncomingCallbackTriggerHandlers` |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.py.jinja2` | ~50 строк | Jinja2-шаблон Python middleware |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.fixture.ts` | ~120 строк | Тестовые данные |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.test.ts` | ~180 строк | Unit-тесты |
| `lib/templates/incoming-callback-trigger/incoming-callback-trigger.md` | ~30 строк | Документация шаблона |

### Бэкенд — изменения

| Файл | Объём | Изменение |
|------|-------|-----------|
| `lib/templates/node-handlers/node-handlers.dispatcher.ts` | ~6 строк | Импорт и вызов `generateIncomingCallbackTriggerHandlers` |
| `lib/bot-generator/core/feature-flags.ts` | ~5 строк | Флаг `hasIncomingCallbackTrigger` (опционально) |
| `lib/tests/test-phase-callback-trigger.ts` | ~80 строк | Интеграционные тесты фазы |

### Фронтенд — новые файлы

| Файл | Объём | Описание |
|------|-------|---------|
| `client/components/editor/sidebar/massive/triggers/incoming-callback-trigger.ts` | ~15 строк | Определение компонента в палитре |
| `client/components/editor/properties/components/trigger/IncomingCallbackTriggerConfiguration.tsx` | ~50 строк | Панель свойств (минималистичная, с `TriggerTargetSelector`) |
| `client/components/editor/canvas/canvas-node/incoming-callback-trigger-preview.tsx` | ~30 строк | Превью узла на холсте |

### Фронтенд — изменения

| Файл | Объём | Изменение |
|------|-------|-----------|
| `client/components/editor/sidebar/massive/triggers/index.ts` | ~2 строки | Экспорт нового триггера |
| `client/components/editor/sidebar/constants.ts` | ~1 строка | Добавить в категорию "Триггеры" |
| `client/components/editor/properties/utils/node-constants.ts` | ~1 строка | Добавить в `TRIGGER_NODE_TYPES` |
| `client/components/editor/properties/utils/node-formatters.ts` | ~1 строка | Добавить отображаемое имя |
| `client/components/editor/properties/components/main/properties-panel.tsx` | ~6 строк | Импорт и условие рендеринга панели свойств |
| `client/components/editor/canvas/canvas-node/canvas-node.tsx` | ~4 строки | Импорт и рендеринг превью |

---

## Ключевые моменты реализации

1. Следовать паттерну `incoming_message_trigger` — структура файлов идентична
2. Middleware регистрируется ПОСЛЕ явных `callback_trigger` обработчиков — как fallback
3. Не вызывать `callback_query.answer()` в middleware — это делает основной обработчик
4. Переменные `{callback_data}` и `{button_text}` доступны внутри триггера
5. JSDoc на русском языке во всех файлах

## Порядок реализации

1. `node-schema.ts` — добавить тип
2. `lib/templates/incoming-callback-trigger/` — создать модуль
3. `node-handlers.dispatcher.ts` — подключить
4. Фронтенд компоненты
5. Тесты

---

## Статус

🔲 Не реализовано — план готов, ожидает реализации

---

## outgoing_message_trigger — Триггер исходящего сообщения

Новый тип узла `outgoing_message_trigger` — срабатывает когда бот отправляет сообщение пользователю.

### Сценарии использования

- Пересылать каждое сообщение бота оператору поддержки
- Логировать исходящие сообщения
- Уведомлять о действиях бота

### Доступные переменные

- `{last_bot_message_id}` — ID последнего отправленного сообщения бота
- `{message_text}` — текст последнего отправленного сообщения

### Пример графа

```
[outgoing_message_trigger]
        ↓
[forward_message]
  источник: Последнее сообщение бота ({last_bot_message_id})
  получатель: 2300967595 (группа)
  топик: {support_thread_id}
```

### Интеграция с forward_message

В узле `forward_message` добавлен новый режим источника "Последнее сообщение бота" (`last_bot_message`). Использует переменную `{last_bot_message_id}` которую сохраняет `outgoing_message_trigger`.
