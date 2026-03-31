# forward-message.py.jinja2

## Описание

Шаблон генерирует Python-обработчик для узла `forward_message`. Он умеет:
- определять исходное сообщение
- пересылать в один или несколько чатов назначения
- учитывать `disable_notification`

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

## Пример

```ts
import { generateForwardMessageFromNode } from 'lib/templates/forward-message';

const code = generateForwardMessageFromNode(node);
```

## Структура файлов

```
forward-message/
├── forward-message.py.jinja2
├── forward-message.params.ts
├── forward-message.schema.ts
├── forward-message.renderer.ts
├── forward-message.fixture.ts
├── forward-message.test.ts
├── forward-message.md
└── index.ts
```
