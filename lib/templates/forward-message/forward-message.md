# `forward-message.py.jinja2`

## Описание

Шаблон генерирует Python-обработчик для узла `forward_message`. Он умеет:

- определять исходное сообщение
- пересылать его в один или несколько чатов назначения
- учитывать `disable_notification`
- использовать список `ADMIN_IDS`

## Источник сообщения

Шаблон поддерживает четыре режима источника:

- `current_message` — текущее сообщение из `callback_query`
- `last_message` — последнее сохранённое сообщение из `bot_messages`, если логирование сообщений доступно
- `manual` — ручной `message_id`
- `variable` — `message_id` из пользовательской переменной

Если у узла задан `sourceMessageNodeId`, шаблон пытается найти последнее бот-сообщение именно этого узла в `bot_messages`.
Это делает фронтовую связь `message -> forward_message` полезной не только визуально, но и в генерации.
Такая связь одновременно задаёт источник сообщения и может использоваться как обычный автопереход к `forward_message`.

Если логирование сообщений или `db_pool` недоступны, шаблон честно делает fallback на текущее сообщение из `callback_query`.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `nodeId` | `string` | - | ID узла |
| `safeName` | `string` | - | Безопасное имя функции |
| `sourceMessageIdSource` | `current_message \| last_message \| manual \| variable` | `current_message` | Способ определить исходное сообщение |
| `sourceMessageId` | `string` | `''` | Ручной `message_id` |
| `sourceMessageVariableName` | `string` | `''` | Имя переменной с `message_id` |
| `sourceMessageNodeId` | `string` | `''` | ID привязанного узла-источника |
| `targetRecipients` | `ForwardMessageTargetRecipient[]` | `[]` | Получатели пересылки |
| `disableNotification` | `boolean` | `false` | Тихая пересылка |
| `hideAuthor` | `boolean` | `false` | Скрыть автора — использует `copy_message` вместо `forward_message` |

## Параметры ForwardMessageTargetRecipient

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `id` | `string` | - | ID получателя внутри узла |
| `targetChatIdSource` | `'manual' \| 'variable' \| 'admin_ids'` | - | Способ указания чата назначения |
| `targetChatId` | `string` | `''` | ID или username чата |
| `targetChatVariableName` | `string` | `''` | Имя переменной с ID чата |
| `targetChatType` | `'user' \| 'group'` | `'user'` | Тип получателя |
| `targetThreadId` | `string` | `''` | ID топика (message_thread_id) для форум-групп |
| `targetThreadIdSource` | `'manual' \| 'variable'` | `'manual'` | Источник ID топика |
| `targetThreadIdVariable` | `string` | `''` | Имя переменной с ID топика |

## Пример

```ts
import { generateForwardMessageFromNode } from 'lib/templates/forward-message';

const code = generateForwardMessageFromNode(node);
```

## Ограничения

- Реальное разрешение `sourceMessageNodeId` и `last_message` опирается на наличие логов сообщений в `bot_messages`.
- Если проект не использует логирование сообщений, генерация не ломается, но оба режима деградируют до безопасного fallback на текущее сообщение.
- `sourceMessageNodeId` не создаёт отдельный runtime-граф зависимостей сам по себе: он использует уже сохранённые сообщения узла, если они есть в журнале.

## ID топика из переменной

Поле `targetThreadIdSource` позволяет брать `message_thread_id` из переменной пользователя вместо статического значения.
Это необходимо для сценариев поддержки, где каждый пользователь имеет свой топик (`support_thread_id`).

Пример: `targetThreadIdSource: 'variable'`, `targetThreadIdVariable: 'support_thread_id'`

## Структура файлов

```text
forward-message/
|-- forward-message.py.jinja2
|-- forward-message.params.ts
|-- forward-message.schema.ts
|-- forward-message.renderer.ts
|-- forward-message.fixture.ts
|-- forward-message.test.ts
|-- forward-message.md
`-- index.ts
```
