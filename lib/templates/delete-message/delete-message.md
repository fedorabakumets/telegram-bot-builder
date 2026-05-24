# delete_message — серверный рендерер

Модуль генерирует Python-код для узла `delete_message`, который удаляет одно или несколько сообщений через `bot.delete_message()` / `bot.delete_messages()`.

## Структура модуля

| Файл | Назначение |
|------|-----------|
| `delete-message.params.ts` | TypeScript интерфейсы `DeleteMessageEntry` и `DeleteMessageTemplateParams` |
| `delete-message.schema.ts` | Zod схема `deleteMessageParamsSchema` для валидации |
| `delete-message.renderer.ts` | Функции `collectDeleteMessageEntries`, `generateDeleteMessage`, `generateDeleteMessageHandlers` |
| `delete-message.py.jinja2` | Jinja2 шаблон генерации Python-кода |
| `delete-message.fixture.ts` | Тестовые фикстуры |
| `index.ts` | Реэкспорт модуля |

## Поля узла

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|---------|
| `messageIdSource` | `'current_message' \| 'last_bot_message' \| 'last_n' \| 'custom'` | `'current_message'` | Источник ID сообщения |
| `messageIdManual` | `string` | `''` | ID или `{переменная}` для режима custom |
| `lastNCount` | `string` | `''` | Количество для режима last_n |
| `chatIdSource` | `'current_chat' \| 'custom'` | `'current_chat'` | Источник ID чата |
| `chatIdManual` | `string` | `''` | ID чата или `{переменная}` |
| `ignoreErrors` | `boolean` | `true` | Не прерывать сценарий при ошибке |
| `bulkDelete` | `boolean` | `false` | Массовое удаление из переменной |
| `bulkMessageIdsVariable` | `string` | `''` | Имя переменной с массивом ID |
| `autoTransitionTo` | `string` | `''` | ID следующего узла |

## Режимы messageIdSource

| Режим | Что делает |
|-------|-----------|
| `current_message` | Удаляет сообщение из `callback_query.message` |
| `last_bot_message` | Удаляет последнее сообщение бота из `user_data[user_id]['last_bot_message_id']` |
| `last_n` | Генерирует диапазон ID назад от текущего и вызывает `deleteMessages` |
| `custom` | Берёт ID из поля `messageIdManual` (число или `{переменная}`) |

## Особенности

- При `bulkDelete: true` массив ID берётся из переменной и разбивается на чанки по 100.
- При `last_n` диапазон также разбивается на чанки по 100.
- При `chatIdSource: 'custom'` автоматически добавляется `-100` если ID положительный и длинный (≥10 цифр).
- При `ignoreErrors: true` ошибки логируются, но не прерывают сценарий. Автопереход выполняется в любом случае.

## Ограничения Telegram

- Бот может удалять чужие сообщения только в группах (нужны права `can_delete_messages`).
- Сообщения старше 48 часов удалить нельзя.
- В личных чатах бот удаляет только свои сообщения.
- `deleteMessages` принимает до 100 ID за один вызов.

## Использование

```ts
import { generateDeleteMessageHandlers } from '../delete-message';

const code = generateDeleteMessageHandlers(nodes);
```
