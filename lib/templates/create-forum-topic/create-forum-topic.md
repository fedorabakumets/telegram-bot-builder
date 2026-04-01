# `create-forum-topic.py.jinja2`

## Описание

Шаблон генерирует Python-обработчик для узла `create_forum_topic`. Он умеет:

- определять ID форум-группы вручную или из переменной пользователя
- подставлять переменные пользователя в название топика (`{user_name}` и т.д.)
- создавать топик через `bot.create_forum_topic()` с заданным цветом иконки
- сохранять `thread_id` созданного топика в переменную пользователя
- пропускать создание, если переменная с `thread_id` уже заполнена (`skipIfExists`)

## Источник ID форум-группы

Шаблон поддерживает два режима:

- `manual` — ID или username группы задан вручную в поле `forumChatId`
- `variable` — ID группы берётся из переменной пользователя `forumChatVariableName`

В обоих случаях числовой ID нормализуется: если значение положительное, добавляется префикс `-100`.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `nodeId` | `string` | — | ID узла |
| `safeName` | `string` | — | Безопасное имя функции |
| `forumChatIdSource` | `manual \| variable` | `manual` | Источник ID форум-группы |
| `forumChatId` | `string` | `''` | ID или username группы (при `manual`) |
| `forumChatVariableName` | `string` | `''` | Имя переменной с ID группы (при `variable`) |
| `topicName` | `string` | `''` | Название топика, поддерживает `{переменные}` |
| `topicIconColor` | `string` | `'7322096'` | Числовое значение цвета иконки Telegram |
| `saveThreadIdTo` | `string` | `''` | Переменная для сохранения `thread_id` |
| `skipIfExists` | `boolean` | `false` | Пропустить, если переменная уже заполнена |

## Цвета иконок

| Значение | Цвет |
|---|---|
| `7322096` | 🔵 Синий |
| `16766590` | 🟡 Жёлтый |
| `13338331` | 🟣 Фиолетовый |
| `9367192` | 🟢 Зелёный |
| `16749490` | 🟠 Оранжевый |
| `16478047` | 🔴 Красный |

## Пример

```ts
import { generateCreateForumTopicFromNode } from 'lib/templates/create-forum-topic';

const code = generateCreateForumTopicFromNode(node);
```

## Ограничения

- Узел работает только с Telegram супергруппами, у которых включены форумы.
- `skipIfExists` проверяет только наличие переменной `saveThreadIdTo` у пользователя — не существование топика в Telegram.
- Подстановка переменных в `topicName` выполняется через `init_all_user_vars`, поэтому требует наличия этой функции в сгенерированном боте.

## Структура файлов

```text
create-forum-topic/
|-- create-forum-topic.py.jinja2
|-- create-forum-topic.params.ts
|-- create-forum-topic.schema.ts
|-- create-forum-topic.renderer.ts
|-- create-forum-topic.fixture.ts
|-- create-forum-topic.test.ts
|-- create-forum-topic.md
`-- index.ts
```
