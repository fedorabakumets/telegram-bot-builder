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
| `variable` | Из переменной (например `{saved_msg_id}`) |
| `manual` | Вручную, поддерживает `{переменные}` |

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

### Самоуничтожающееся сообщение
```
message (сохранить ID) → delay (30 сек) → delete_message (по сохранённому ID)
```

### Антиспам
```
incoming_message_trigger → condition (спам?) → delete_message → mute_user
```

### Обновление меню
```
callback_trigger → delete_message (старое меню) → message (новое меню)
```

### Чистка по расписанию
```
schedule_trigger → bot_table (старые ID) → loop → delete_message
```

### Модерация в группе
```
group_message_trigger → condition (запрещённые слова) → delete_message → message ("Удалено за нарушение")
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
  messageIdSource: 'current_message',
  messageIdVariable: '',
  messageIdManual: '',
  chatIdSource: 'current_chat',
  chatIdVariable: '',
  chatIdManual: '',
  ignoreErrors: true,
  bulkDelete: false,
  bulkMessageIdsVariable: '',
}
```
