# Шаблон обработчика прав администратора (admin-rights.py.jinja2)

## Описание

Генерирует Python обработчик для интерактивного управления правами администраторов Telegram групп. Создаёт inline-клавиатуру с кнопками-переключателями для каждого права, позволяя включать и отключать их в реальном времени.

## Поддерживаемые права

| Ключ | Описание |
|---|---|
| `can_change_info` | Изменение профиля группы |
| `can_delete_messages` | Удаление сообщений |
| `can_restrict_members` | Блокировка участников |
| `can_invite_users` | Приглашение участников |
| `can_pin_messages` | Закрепление сообщений |
| `can_manage_video_chats` | Управление видеочатами |
| `can_post_stories` | Публикация историй |
| `can_edit_stories` | Редактирование историй |
| `can_delete_stories` | Удаление историй |
| `is_anonymous` | Анонимность администратора |
| `can_promote_members` | Назначение администраторов |

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| nodeId | string | — | ID узла (обязательный) |
| safeName | string | — | Безопасное имя функции (обязательный) |
| messageText | string | `'⚙️ Управление правами администратора'` | Текст сообщения |
| command | string | `'admin_rights'` | Команда без `/` |

## Примеры использования

### Низкоуровневый API

```typescript
import { generateAdminRightsHandler } from './templates/admin-rights';

const code = generateAdminRightsHandler({
  nodeId: 'admin_rights_node_1',
  safeName: 'admin_rights_node_1',
  messageText: '⚙️ Управление правами администратора',
  command: 'admin_rights',
});
```

### Высокоуровневый API (из узла графа)

```typescript
import { generateAdminRightsFromNode } from './templates/admin-rights';

const code = generateAdminRightsFromNode(node);
```

## Генерируемый Python код

Шаблон генерирует несколько компонентов:

### 1. Вспомогательные функции

```python
# Получение текущих прав администратора
async def get_admin_rights_<safeName>(bot, chat_id, target_user_id):
    ...

# Создание inline-клавиатуры с переключателями
async def create_admin_rights_keyboard_<safeName>(bot, chat_id, target_user_id, node_id):
    ...
```

### 2. Command handler

```python
@dp.message(Command("admin_rights"))
async def <safeName>_command_handler(message: types.Message, bot):
    # Проверяет права вызывающего пользователя
    # Определяет target_user_id через reply / @mention / числовой ID
    # Отправляет сообщение с inline-клавиатурой
    ...
```

### 3. Callback handler

```python
@dp.callback_query(lambda c: c.data == "<nodeId>")
async def handle_callback_<safeName>(callback_query: types.CallbackQuery, bot):
    # Проверяет права бота
    # Отображает/обновляет клавиатуру
    ...
```

### 4. Toggle handlers (11 штук — по одному на каждое право)

```python
@dp.callback_query(lambda c: c.data.startswith("tr_can_change_in_"))
async def toggle_can_change_info_<safeName>(callback_query: types.CallbackQuery, bot):
    # Переключает конкретное право через bot.promote_chat_member
    # Обновляет клавиатуру
    ...
```

### 5. Refresh handler

```python
@dp.callback_query(lambda c: c.data.startswith("ref_"))
async def refresh_admin_rights_<safeName>(callback_query: types.CallbackQuery, bot):
    # Перечитывает текущие права и обновляет клавиатуру
    ...
```

## Формат callback_data

| Тип | Формат | Пример |
|---|---|---|
| Toggle права | `tr_<short_key>_<user_id>_<node_hash>` | `tr_can_change_in_123456_abc123` |
| Refresh | `ref_<user_id>_<node_hash>` | `ref_123456_abc123` |
| Открытие | `<nodeId>` | `admin_rights_node_1` |

`short_key` — первые 12 символов ключа права (для соблюдения лимита Telegram в 64 байта).

## Определение целевого пользователя

Command handler определяет `target_user_id` в следующем порядке:

1. Ответ на сообщение (`reply_to_message`)
2. Прямое упоминание (`text_mention` entity)
3. Упоминание через `@username` (поиск среди администраторов)
4. Числовой ID в тексте команды (6+ цифр)

## Структура файлов

```
admin-rights/
├── admin-rights.py.jinja2     (шаблон)
├── admin-rights.params.ts     (TypeScript интерфейсы)
├── admin-rights.schema.ts     (Zod схема)
├── admin-rights.renderer.ts   (generateAdminRightsHandler, generateAdminRightsFromNode)
├── admin-rights.fixture.ts    (тестовые данные)
├── admin-rights.test.ts       (тесты)
├── admin-rights.md            (документация)
└── index.ts                   (экспорт)
```

## Запуск тестов

```bash
node run-tests.js --pattern admin-rights
```
