# Нода `delete_message` — полноценное удаление сообщений

## Проблема

Сейчас `delete_message` существует только как часть шаблона `synonyms` — работает исключительно в группах через ответ на сообщение словом-синонимом. Нельзя:
- Удалить сообщение по ID в произвольном месте сценария
- Удалить последнее сообщение бота (обновление меню)
- Использовать в цепочке как action-ноду
- Удалить несколько сообщений за раз

## Решение

Создать полноценную action-ноду `delete_message` с собственным шаблоном в `lib/templates/delete-message/`.

## Панель свойств

### Источник Message ID

| Опция | Описание |
|-------|----------|
| `current_message` | Удалить входящее сообщение пользователя |
| `last_bot_message` | Удалить последнее сообщение бота |
| `reply_message` | Удалить сообщение, на которое ответили (reply) |
| `last_n` | Удалить последние N сообщений (диапазон ID назад от текущего) |
| `custom` | Указать ID вручную (поддерживает `{переменные}`) |

### Источник Chat ID

| Опция | Описание |
|-------|----------|
| `current_chat` | Текущий чат |
| `variable` | Из переменной |
| `manual` | Вручную |

### Дополнительные настройки

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `ignoreErrors` | switch | `true` | Не падать если сообщение уже удалено/не найдено |
| `bulkDelete` | switch | `false` | Множественное удаление (массив ID) |
| `bulkMessageIdsVariable` | text | `''` | Переменная с массивом message_id (до 100 штук) |

> **Режим `last_n`:** при выборе `messageIdSource: 'last_n'` появляется поле `lastNCount` — количество последних сообщений для удаления (число или `{переменная}`). Генерирует диапазон ID от текущего `message_id` назад.

### Автопереход

Стандартный выбор следующего узла.

## Что НЕ входит в ноду

- Текст подтверждения — для этого есть нода `message`
- Массив chat_id — для нескольких чатов используй `loop`
- Синонимы — старый механизм остаётся в `synonyms` для обратной совместимости

## Telegram API

- Одно сообщение: `bot.delete_message(chat_id, message_id)`
- Несколько (до 100): `bot.delete_messages(chat_id, message_ids)`

## Типичные паттерны

### 1. Самоуничтожающееся сообщение
```
message (сохранить ID) → delay (30 сек) → delete_message (messageIdSource: variable)
```
Бот отправляет временное сообщение, через 30 секунд удаляет его.

### 2. Антиспам в группе
```
incoming_message_trigger → condition (спам?) → delete_message (current_message) → mute_user
```
Если сообщение содержит запрещённые слова — удалить и замутить.

### 3. Обновление меню (замена сообщения)
```
callback_trigger → delete_message (last_bot_message) → message (новое меню)
```
Пользователь нажал кнопку — старое меню удаляется, отправляется новое.

### 4. "Удалить 50" — быстрый режим (last_n)
```
text_trigger ("удалить", contains)
  → set_variable (regex: извлечь число → count)
  → delete_message (messageIdSource: last_n, lastNCount: {count})
```
Админ пишет "удалить 50" — бот берёт текущий message_id, генерирует диапазон [id-1, id-2, ..., id-50] и вызывает `deleteMessages`.

**Плюсы:** просто, не требует подготовки.
**Минусы:** может промахнуться мимо удалённых/сервисных сообщений (они просто проигнорируются).

### 5. "Удалить 50" — точный режим (через таблицу)
```
# Подготовка (работает постоянно):
incoming_message_trigger → bot_table (insert: chat_id, message_id, user_id, timestamp)

# Команда удаления:
text_trigger ("удалить", contains)
  → set_variable (regex: извлечь число → count)
  → bot_table (чтение: последние {count} записей из этого чата → msg_ids)
  → delete_message (bulkDelete: true, bulkMessageIdsVariable: msg_ids)
```
Бот заранее логирует все message_id в таблицу. При команде "удалить 50" — достаёт точные ID из базы.

**Плюсы:** 100% точность, можно фильтровать (по юзеру, по времени, по типу).
**Минусы:** нужна предварительная настройка, занимает место в БД.

### 6. Чистка по расписанию
```
schedule_trigger (каждый день в 03:00)
  → bot_table (сообщения старше 24ч → old_ids)
  → delete_message (bulkDelete: true, bulkMessageIdsVariable: old_ids)
  → bot_table (удалить записи из лога)
```

### 7. Модерация — удалить и предупредить
```
group_message_trigger
  → condition (запрещённые слова?)
  → delete_message (current_message)
  → message ("⚠️ {first_name}, сообщение удалено за нарушение правил")
  → bot_table (upsert: warnings +1)
  → condition (warnings >= 3?)
    → ban_user
```

## Взаимодействие с другими нодами

### Входящие связи (что стоит до)

Любой триггер, `condition`, `loop`, `delay`, `bot_table`, `http_request`, `set_variable`, `message` (сохранивший ID).

### Исходящие связи (автопереход)

Любая action-нода: `message`, `set_variable`, `bot_table`, `condition`, `delay`, `ban_user`, `mute_user` и т.д.

## Реализация

### Файлы для создания

1. `lib/templates/delete-message/delete-message.params.ts`
2. `lib/templates/delete-message/delete-message.schema.ts`
3. `lib/templates/delete-message/delete-message.renderer.ts`
4. `lib/templates/delete-message/delete-message.py.jinja2`
5. `lib/templates/delete-message/delete-message.md`
6. `lib/tests/test-phase*-delete-message.ts`

### Файлы для обновления

1. `client/components/editor/sidebar/massive/content-management/delete-message.ts` — обновить `defaultData`
2. `client/components/editor/properties/components/configuration/content-management-configuration.tsx` — новая панель свойств
3. `docs/bot-json-prompt.md` — описание для ИИ
4. `docs/features/NODE_TYPES.md` — документация

## defaultData

```typescript
{
  messageIdSource: 'current_message', // 'current_message' | 'last_bot_message' | 'reply_message' | 'last_n' | 'custom'
  messageIdManual: '',
  lastNCount: '',              // количество последних сообщений (число или {переменная})
  chatIdSource: 'current_chat', // 'current_chat' | 'custom'
  chatIdManual: '',
  ignoreErrors: true,
  bulkDelete: false,
  bulkMessageIdsVariable: '',
}
```
