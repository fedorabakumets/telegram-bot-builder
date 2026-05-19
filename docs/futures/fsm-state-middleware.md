# FSM State Middleware — глобальные состояния с автовосстановлением

## Проблема

Сейчас `delay` (background mode) использует `asyncio.create_task()` — при перезапуске бота все активные таймеры теряются. Если бот перезапустился во время полёта/кулдауна — игрок застревает в состоянии "в полёте" навсегда.

Текущий workaround: `flight_expires_at` (timestamp в bot_table) + проверка `now > expires_at` при следующем действии. Работает, но требует ручной проверки в каждом узле.

## Решение

Middleware на уровне генерации бота, который при **каждом** входящем сообщении/callback:

1. Читает активные "глобальные состояния" пользователя из Redis FSM
2. Проверяет не истекли ли они (по timestamp)
3. Если истекли — автоматически завершает (вызывает целевой узел)
4. Если активны — блокирует определённые действия (опционально)

## Архитектура

### Новый тип данных в FSM: `pending_actions`

```python
# Redis key: fsm:pending:{user_id}
# Value: JSON массив активных отложенных действий
[
  {
    "id": "flight_to_mars",
    "type": "delay_recovery",
    "expires_at": 1716234567,
    "target_node_id": "fly-arrive-mars",
    "data": {"planet_id": "mars", "planet_name": "🔴 Марс"},
    "block_actions": ["fly-*"]  # опционально: какие действия блокировать
  }
]
```

### Middleware (генерируется в bot template)

```python
async def pending_actions_middleware(handler, event, data):
    user_id = event.from_user.id
    pending = await get_pending_actions(user_id)  # из Redis
    
    now = int(time.time())
    for action in pending:
        if now >= action["expires_at"]:
            # Действие истекло — выполняем целевой узел
            await execute_node(action["target_node_id"], user_id, action["data"])
            await remove_pending_action(user_id, action["id"])
    
    # Проверяем блокировки для оставшихся активных действий
    active = [a for a in pending if now < a["expires_at"]]
    for action in active:
        if should_block(event, action["block_actions"]):
            await event.answer("🚀 Вы в полёте! Дождитесь прибытия.")
            return  # не передаём дальше
    
    return await handler(event, data)
```

### Новая нода или расширение delay

Вариант A: расширить `delay` нодой полем `recoverable: true` — при генерации добавляет запись в `pending_actions`.

Вариант B: новая нода `scheduled_action` — явно задаёт что выполнить через N секунд с гарантией выполнения.

## Что это даёт

- **Персистентность** — Redis переживает перезапуск бота
- **Автовосстановление** — не нужно ручных проверок в каждом узле
- **Блокировка действий** — опционально запрещать определённые команды во время ожидания
- **Универсальность** — работает для любых delay/cooldown/таймеров, не только полётов

## Зависимости

- Redis (уже есть)
- Изменение `middleware.py.jinja2` — добавить `pending_actions_middleware`
- Изменение `delay.py.jinja2` — при `mode: "background"` + `recoverable: true` записывать в Redis
- Новый шаблон `pending-actions/pending-actions.py.jinja2`
- UI: чекбокс "Восстанавливать при перезапуске" в свойствах delay ноды

## Приоритет

Средний. Текущий workaround (timestamp + проверка в карте) работает для космического торговца. FSM middleware нужен когда появятся другие боты с таймерами/кулдаунами.

## Связанные файлы

- `lib/templates/middleware/middleware.py.jinja2`
- `lib/templates/delay/delay.py.jinja2`
- `lib/templates/redis-storage/redis-storage.py.jinja2`
- `lib/templates/main/main.py.jinja2`
