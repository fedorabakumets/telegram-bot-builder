# Шаблон рассылки Client API (broadcast-client.py.jinja2)

## Описание

Генерирует Python обработчик массовой рассылки сообщений через Telethon Client API. В отличие от Bot API, Client API работает от имени пользователя и имеет меньше ограничений на рассылку.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| nodeId | string | — | ID узла (обязательный) |
| idSourceType | `'user_ids'` \| `'bot_users'` \| `'both'` | `'bot_users'` | Источник ID получателей |
| successMessage | string | `''` | Сообщение после успешной рассылки |
| errorMessage | string | `''` | Сообщение при ошибке |
| broadcastNodes | BroadcastNode[] | `[]` | Список сообщений для рассылки |

### BroadcastNode

| Поле | Тип | Описание |
|---|---|---|
| id | string | ID узла сообщения |
| text | string | Текст сообщения |
| formatMode | string | Режим форматирования |
| imageUrl | string | URL изображения |
| audioUrl | string | URL аудио |
| videoUrl | string | URL видео |
| documentUrl | string | URL документа |
| attachedMedia | string[] | Список URL медиафайлов |
| autoTransitionTo | string | ID следующего узла в цепочке |

## Примеры использования

### Низкоуровневый API

```typescript
import { generateBroadcastClient } from './templates/broadcast-client';

const code = generateBroadcastClient({
  nodeId: 'broadcast_1',
  idSourceType: 'bot_users',
  successMessage: 'Рассылка завершена',
  broadcastNodes: [
    { id: 'msg_1', text: 'Привет!', formatMode: 'none' },
  ],
});
```

### Высокоуровневый API (из узла графа)

```typescript
import { generateBroadcastClientFromNode } from './templates/broadcast-client';

const code = generateBroadcastClientFromNode(broadcastNode, allNodes);
```

## Структура файлов

```
broadcast-client/
├── broadcast-client.py.jinja2     (шаблон)
├── broadcast-client.params.ts     (TypeScript интерфейсы)
├── broadcast-client.schema.ts     (Zod схема)
├── broadcast-client.renderer.ts   (generateBroadcastClient, generateBroadcastClientFromNode)
├── broadcast-client.fixture.ts    (тестовые данные)
├── broadcast-client.test.ts       (тесты)
└── index.ts                       (экспорт)
```

## Запуск тестов

```bash
node run-tests.js --pattern broadcast-client
```

## Отличие от broadcast-bot

| | broadcast-client | broadcast-bot |
|---|---|---|
| Библиотека | Telethon (Client API) | aiogram (Bot API) |
| Ограничения | Меньше ограничений | Лимиты Telegram Bot API |
| Использование | Боты с аккаунтом пользователя | Стандартные боты |
