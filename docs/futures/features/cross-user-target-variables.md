# Кросс-пользовательские переменные через {target.*}

## Проблема

Когда админ нажимает кнопку с `customCallbackData: "approve_{user_id}"`, обработчик работает в контексте админа. Переменные заявителя (`{name}`, `{user_telegram}`) недоступны — `init_all_user_vars(admin_id)` загружает только данные админа.

## Текущее поведение

- `{user_id}`, `{username}`, `{first_name}` — всегда данные того, кто нажал кнопку
- Переменные другого пользователя недоступны
- `_cb_dynamic_id` содержит ID целевого пользователя, но его данные не загружаются

## Желаемое поведение

Двойной контекст переменных:

| Префикс | Источник | Пример |
|---------|----------|--------|
| (без префикса) | Текущий пользователь (кто нажал) | `{username}`, `{user_id}` |
| `target.` | Целевой пользователь (из `_cb_dynamic_id`) | `{target.name}`, `{target.user_telegram}` |

### Пример использования в edit_message

```
📋 Заявка от {target.name}
🎂 Возраст: {target.user_age}
💍 Статус: {target.user_status}
📱 Telegram: {target.user_telegram}

━━━━━━━━━━━━━━━━━━
✅ ОДОБРЕНО — @{username}, {now}
```

## Реализация

### Где: шаблоны с `_cb_is_dynamic` (message.py.jinja2, edit-message.py.jinja2)

После извлечения `_cb_dynamic_id`:

```python
# Подгружаем переменные целевого пользователя с префиксом target.*
try:
    _target_id = int(_cb_suffix)
    _target_vars = await init_all_user_vars(_target_id)
    # Добавляем с префиксом target. — не конфликтует с переменными текущего пользователя
    for _tk, _tv in _target_vars.items():
        if not _tk.startswith("_"):  # пропускаем служебные
            all_user_vars[f"target.{_tk}"] = _tv
    # Также добавляем без префикса как fallback (для обратной совместимости)
    # НЕ перезаписываем системные переменные текущего пользователя
    _system_keys = {"user_id", "username", "first_name", "last_name", "user_name", "language_code", "is_premium", "is_bot", "bot_token", "project_id", "token_id"}
    for _tk, _tv in _target_vars.items():
        if _tk not in all_user_vars and _tk not in _system_keys:
            all_user_vars[_tk] = _tv
except (ValueError, TypeError):
    pass
```

### Поведение

1. `{target.name}` — явно данные целевого пользователя (всегда работает)
2. `{name}` — сначала ищет у текущего пользователя, если нет — берёт из target (fallback)
3. `{username}` — всегда текущий пользователь (системная переменная, не перезаписывается)

### Применимость

- Модерация заявок (админ видит данные заявителя)
- Реферальные системы (пользователь видит данные реферала)
- Переводы между пользователями
- Любой сценарий где один пользователь действует в контексте другого

## Приоритет

Средний. Текущий workaround — короткий статус без переменных заявителя.
