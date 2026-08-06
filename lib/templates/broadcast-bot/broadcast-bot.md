# Шаблон рассылки Bot API (broadcast-bot.py.jinja2)

## Описание

Генерирует Python обработчик массовой рассылки сообщений через aiogram Bot API. Поддерживает текст, медиафайлы и цепочки сообщений через `autoTransitionTo`. Получатели берутся из таблицы `bot_users`.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| nodeId | string | — | ID узла (обязательный) |
| successMessage | string | `''` | Сообщение после успешной рассылки |
| errorMessage | string | `''` | Сообщение при ошибке |
| broadcastNodes | BroadcastNode[] | `[]` | Список сообщений для рассылки |

### BroadcastNode

| Поле | Тип | Описание |
|---|---|---|
| id | string | ID узла сообщения |
| text | string | Текст сообщения |
| formatMode | string | Режим форматирования (`'none'`, `'markdown'`, `'html'`) |
| imageUrl | string | URL изображения |
| audioUrl | string | URL аудио |
| videoUrl | string | URL видео |
| documentUrl | string | URL документа |
| attachedMedia | string[] | Список URL медиафайлов |
| autoTransitionTo | string | ID следующего узла в цепочке |

## Примеры использования

### Низкоуровневый API

```typescript
import { generateBroadcastBot } from './templates/broadcast-bot';

const code = generateBroadcastBot({
  nodeId: 'broadcast_1',
  successMessage: 'Рассылка завершена',
  broadcastNodes: [
    { id: 'msg_1', text: 'Привет!', formatMode: 'none' },
  ],
});
```

### Высокоуровневый API (из узла графа)

```typescript
import { generateBroadcastBotFromNode } from './templates/broadcast-bot';

const code = generateBroadcastBotFromNode(broadcastNode, allNodes);
```

### Сбор узлов рассылки из графа

```typescript
import { collectBroadcastNodes } from './templates/broadcast-bot';

// Собирает message-узлы с enableBroadcast=true
// и разворачивает цепочки autoTransitionTo
const nodes = collectBroadcastNodes(allNodes, broadcastNodeId);
```

## Структура файлов

```
broadcast-bot/
├── broadcast-bot.py.jinja2     (шаблон)
├── broadcast-bot.params.ts     (TypeScript интерфейсы)
├── broadcast-bot.schema.ts     (Zod схема)
├── broadcast-bot.renderer.ts   (generateBroadcastBot, generateBroadcastBotFromNode)
├── broadcast-bot.fixture.ts    (тестовые данные)
├── broadcast-bot.test.ts       (тесты)
└── index.ts                    (экспорт)
```

## Запуск тестов

```bash
node run-tests.js --pattern broadcast-bot
```

## Отличие от broadcast-client

| | broadcast-bot | broadcast-client |
|---|---|---|
| Библиотека | aiogram (Bot API) | Telethon (Client API) |
| Ограничения | Лимиты Telegram Bot API | Меньше ограничений |
| Использование | Стандартные боты | Боты с аккаунтом пользователя |
