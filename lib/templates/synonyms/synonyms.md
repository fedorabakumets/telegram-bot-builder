# Шаблон обработчиков синонимов (synonyms.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для синонимов команд и сообщений Telegram бота. Синоним — это текстовая фраза, которая триггерит тот же обработчик, что и оригинальная команда или узел. Поддерживает три типа узлов: команды (`start`/`command`), сообщения (`message`) и управление контентом (`pin_message`, `unpin_message`, `delete_message`).

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| synonyms | SynonymEntry[] | Массив синонимов для генерации |

### SynonymEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| synonym | string | Текст синонима | ✅ |
| nodeId | string | ID узла | ✅ |
| nodeType | SynonymNodeType | Тип узла | ✅ |
| functionName | string | Имя функции оригинального обработчика | только для command/start |
| originalCommand | string | Оригинальная команда (например `/start`) | только для command/start |
| messageText | string | Текст ответного сообщения | нет (есть дефолт) |
| disableNotification | boolean | Отключить уведомление при закреплении | нет (для pin_message) |
| isPrivateOnly | boolean | Только приватные чаты (для command/message) | нет |

### SynonymNodeType

```typescript
type SynonymNodeType =
  | 'start' | 'command'
  | 'message'
  | 'pin_message' | 'unpin_message' | 'delete_message'
  | 'ban_user' | 'unban_user' | 'mute_user' | 'unmute_user'
  | 'kick_user' | 'promote_user' | 'demote_user' | 'admin_rights';
```

## Типы обработчиков

### 1. command / start

Делегирует вызов оригинальному обработчику напрямую. Синонимы работают во всех типах чатов (без фильтра по типу чата). При `isPrivateOnly=true` добавляется проверка:

```python
@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
    # Синоним для команды /start
    if message.chat.type != 'private':
        await message.answer("❌ Эта команда доступна только в приватных чатах")
        return
    await start_handler(message)
```

### 2. message

Создаёт `MockCallback` для эмуляции нажатия кнопки и вызывает `handle_callback_*`:

```python
@dp.message(lambda message: message.text and message.text.lower() == "меню")
async def message_msg_main_menu_synonym_меню_handler(message: types.Message):
    class MockCallback:
        ...
    mock_callback = MockCallback("msg_main_menu", message.from_user, message)
    await handle_callback_msg_main_menu(mock_callback)
```

### 3. pin_message / unpin_message / delete_message

Работает только в группах, поддерживает ответ на сообщение или указание ID:

```python
@dp.message(lambda message: message.text and (message.text.lower() == "закрепить" or ...) and message.chat.type in ['group', 'supergroup'])
async def pin_message_pin_1_synonym_закрепить_handler(message: types.Message):
    ...
    await bot.pin_chat_message(chat_id=chat_id, message_id=target_message_id, disable_notification=False)
```

## Примеры использования

### Синонимы для /start

```typescript
generateSynonyms({
  synonyms: [
    { synonym: 'привет', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
    { synonym: 'hello', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
  ],
});
```

### Синонимы для message-узла

```typescript
generateSynonyms({
  synonyms: [
    { synonym: 'главная', nodeId: 'msg_home', nodeType: 'message' },
  ],
});
```

### Синонимы для управления контентом

```typescript
generateSynonyms({
  synonyms: [
    { synonym: 'закрепить', nodeId: 'pin_1', nodeType: 'pin_message', disableNotification: false },
    { synonym: 'открепить', nodeId: 'unpin_1', nodeType: 'unpin_message' },
    { synonym: 'удалить', nodeId: 'del_1', nodeType: 'delete_message', messageText: '🗑️ Удалено!' },
  ],
});
```

## Маркеры узлов

Каждый обработчик оборачивается маркерами для идентификации принадлежности к узлу:

```python
# @@NODE_START:start_1@@
...обработчик...
# @@NODE_END:start_1@@
```

## Интеграция с bot-generator

`lib/bot-generator/Synonyms` остаётся как слой оркестрации — собирает `SynonymEntry[]` из узлов и вызывает `generateSynonyms()`:

```typescript
import { generateSynonyms } from '../../templates/synonyms';

// В generateSynonymHandlers():
const entries: SynonymEntry[] = nodesWithSynonyms.flatMap(node =>
  node.data.synonyms.map(synonym => ({
    synonym,
    nodeId: node.id,
    nodeType: node.type as SynonymNodeType,
    functionName: node.data.command?.replace('/', ''),
    originalCommand: node.data.command,
  }))
);
return generateSynonyms({ synonyms: entries });
```

## Тесты

```bash
npm run test:synonyms
```

## Структура файлов

```
synonyms/
├── synonyms.py.jinja2     (шаблон обработчиков)
├── synonyms.params.ts     (TypeScript интерфейсы)
├── synonyms.schema.ts     (Zod схема валидации)
├── synonyms.renderer.ts   (функция generateSynonyms)
├── synonyms.fixture.ts    (тестовые данные)
├── synonyms.test.ts       (тесты)
├── synonyms.md            (документация)
└── index.ts               (экспорт)
```
