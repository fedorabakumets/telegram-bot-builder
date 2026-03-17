# Шаблон рассылки (broadcast.py.jinja2)

## Описание

Шаблон генерирует Python `async def handle_broadcast_<nodeId>` для рассылки сообщений
через **Bot API** (aiogram) или **Client API** (Telethon/Userbot).

Ключевые возможности:
- Получение получателей из `user_ids`, `bot_users` или обеих таблиц
- Итерация по списку `broadcastNodes` с заменой переменных для каждого получателя
- Отправка медиа (фото, видео, аудио, документы) с fallback на текст
- Автопереход к следующему узлу (`autoTransitionTo`)
- Подробный отчёт по итогам рассылки

## Параметры

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `nodeId` | `string` | ID узла broadcast | — |
| `broadcastApiType` | `'bot' \| 'client'` | Метод отправки | `'bot'` |
| `idSourceType` | `'user_ids' \| 'bot_users' \| 'both'` | Источник получателей | `'bot_users'` |
| `successMessage` | `string` | Текст отчёта об успехе | `'✅ Рассылка отправлена!'` |
| `errorMessage` | `string` | Текст при ошибке получения получателей | `'❌ Ошибка рассылки'` |
| `broadcastNodes` | `BroadcastNode[]` | Список сообщений для рассылки | `[]` |

### BroadcastNode

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | ID узла сообщения |
| `text` | `string` | Текст сообщения |
| `formatMode` | `string` | Режим форматирования (`'html'`, `'markdown'`, `'none'`) |
| `imageUrl` | `string` | URL фото |
| `audioUrl` | `string` | URL аудио |
| `videoUrl` | `string` | URL видео |
| `documentUrl` | `string` | URL документа |
| `attachedMedia` | `string[]` | Переменные медиа из БД |
| `autoTransitionTo` | `string` | ID следующего узла для автоперехода |

## API

### Низкоуровневый — `generateBroadcast(params)`

Принимает готовые параметры, включая предварительно собранный `broadcastNodes[]`.

```typescript
import { generateBroadcast } from './broadcast.renderer';

const code = generateBroadcast({
  nodeId: 'broadcast_1',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
  broadcastNodes: [
    { id: 'msg_1', text: 'Привет!', formatMode: 'none', attachedMedia: [], autoTransitionTo: '' },
  ],
});
```

### Высокоуровневый — `generateBroadcastFromNode(node, allNodes)`

Принимает узел графа и весь список узлов. Автоматически собирает `broadcastNodes`
из `message`-узлов с `enableBroadcast=true` и разворачивает цепочки `autoTransitionTo`.

```typescript
import { generateBroadcastFromNode } from './broadcast.renderer';

const code = generateBroadcastFromNode(broadcastNode, allNodes);
```

### Утилита — `collectBroadcastNodes(nodes, broadcastNodeId)`

Собирает `BroadcastNode[]` из графа. Включает `message`-узлы с `enableBroadcast=true`,
фильтрует по `broadcastTargetNode` и разворачивает цепочки `autoTransitionTo`.

```typescript
import { collectBroadcastNodes } from './broadcast.renderer';

const nodes = collectBroadcastNodes(allNodes, 'broadcast_1');
```

## Примеры использования

### Bot API, рассылка всем bot_users

```typescript
generateBroadcast({
  nodeId: 'broadcast_1',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
  successMessage: '✅ Готово!',
  broadcastNodes: [
    { id: 'msg_1', text: 'Важная новость!', formatMode: 'html', attachedMedia: [], autoTransitionTo: '' },
  ],
});
```

### Client API (Telethon), оба источника

```typescript
generateBroadcast({
  nodeId: 'broadcast_2',
  broadcastApiType: 'client',
  idSourceType: 'both',
  broadcastNodes: [
    { id: 'msg_1', text: 'Рассылка через Userbot', formatMode: 'none', attachedMedia: [], autoTransitionTo: '' },
  ],
});
```

### Цепочка сообщений с автопереходом

```typescript
generateBroadcast({
  nodeId: 'broadcast_3',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
  broadcastNodes: [
    { id: 'msg_a', text: 'Первое', formatMode: 'none', attachedMedia: [], autoTransitionTo: 'msg_b' },
    { id: 'msg_b', text: 'Второе', formatMode: 'none', attachedMedia: [], autoTransitionTo: '' },
  ],
});
```

## Логика шаблона

### Bot API (`broadcastApiType = 'bot'`)

1. Получение получателей из БД (`user_ids` / `bot_users` / обе таблицы)
2. Итерация по `recipients × broadcast_nodes`
3. Замена переменных через `replace_variables_in_text`
4. Отправка медиа (attachedMedia → статические URL → fallback на `bot.send_message`)
5. Автопереход через `FakeCallbackQuery` + `globals().get("handle_callback_...")`
6. `asyncio.sleep(0.05)` между получателями
7. Отчёт: успешно / ошибок

### Client API (`broadcastApiType = 'client'`)

1. Проверка сессии из `user_telegram_settings`
2. Получение получателей из БД
3. Инициализация `TelegramClient(StringSession(...))`
4. Итерация по `recipients`, внутри — цикл по `broadcast_nodes` с индексом
5. Отправка через `app.send_file` / `app.send_message`
6. Автопереход по индексу в `broadcast_nodes`
7. Обработка `PEER_ID_INVALID` (заблокированные пользователи)
8. `app.connect()` / `app.disconnect()` в `try/finally`
9. Отчёт: успешно / ошибок / заблокировано

## Зависимости Python

**Bot API:** `aiogram`, `asyncpg`, `asyncio`, `logging`

**Client API:** всё выше + `telethon` (`TelegramClient`, `StringSession`, `PeerUser`)

## Структура файлов

```
broadcast/
├── broadcast.py.jinja2       шаблон (Bot API + Client API)
├── broadcast.params.ts       типы параметров + BroadcastNode
├── broadcast.schema.ts       Zod схема валидации
├── broadcast.renderer.ts     generateBroadcast / generateBroadcastFromNode / collectBroadcastNodes
├── broadcast.fixture.ts      тестовые данные
├── broadcast.test.ts         тесты
├── broadcast.md              документация
└── index.ts                  экспорт
```

## Тесты

```bash
node --test lib/templates/broadcast/broadcast.test.ts
```

Покрытие:
- Bot API: генерация, получатели, медиа, автопереход, отчёт
- Client API: сессия, Telethon, отправка, автопереход, заблокированные
- `collectBroadcastNodes`: фильтрация, цепочки, broadcastTargetNode
- Невалидные данные и граничные случаи
- Производительность
- Валидация схемы
