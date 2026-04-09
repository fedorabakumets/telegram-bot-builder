# Шаблон: utils.py.jinja2

## Описание

Генерирует Python утилитарные функции для Telegram бота:
- `init_user_variables` — инициализация данных пользователя при регистрации
- `init_all_user_vars` — сбор всех переменных для подстановки в текст
- `get_user_variables` — чтение переменных из локального хранилища
- `check_auth` — проверка авторизации
- `is_admin` — проверка прав администратора (условно)
- `is_private_chat` — проверка типа чата (условно)
- `replace_variables_in_text` — подстановка `{переменная}` и `{вложенный.путь}` в текст

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных |
| `adminOnly` | `boolean` | `false` | Генерировать `is_admin()` |
| `isPrivateOnly` | `boolean` | `false` | Генерировать `is_private_chat()` |

## Переменные пользователя

`init_user_variables(user_id, from_user)` сохраняет в `user_data`:

| Переменная | Источник | Доступна в тексте |
|---|---|---|
| `{user_id}` | `from_user.id` | ✅ |
| `{username}` | `from_user.username` | ✅ |
| `{first_name}` | `from_user.first_name` | ✅ |
| `{last_name}` | `from_user.last_name` | ✅ |
| `{user_name}` | username или first_name или user_id | ✅ |
| `{language_code}` | `from_user.language_code` | ✅ |
| `{is_premium}` | `from_user.is_premium` | ✅ |
| `{is_bot}` | `from_user.is_bot` | ✅ |

## init_user_variables vs init_all_user_vars

| | `init_user_variables` | `init_all_user_vars` |
|---|---|---|
| Когда вызывается | При регистрации (один раз) | Перед каждой отправкой сообщения |
| Что делает | Записывает данные из `from_user` | Читает все переменные для подстановки |
| Побочный эффект | Заполняет `user_data[user_id]` | Нет |
| Источники | Объект `from_user` из апдейта | `user_data` + БД (если включена) |

## replace_variables_in_text

Функция `replace_variables_in_text(text, variables, filters)` заменяет плейсхолдеры `{переменная}` в тексте на их значения.

### Плоские переменные

```python
text = "Привет, {first_name}!"
variables = {"first_name": "Иван"}
# → "Привет, Иван!"
```

### Dot-notation для вложенных JSON путей

Если значение переменной — JSON-строка (или уже распарсенный `dict`), можно обращаться к вложенным полям через точку:

```python
text = "Результат: {validate_response.result.first_name}"
variables = {
    "validate_response": '{"result": {"first_name": "Иван"}}'
}
# → "Результат: Иван"
```

Путь разворачивается рекурсивно: `parts[0]` — ключ в `variables`, остальные части — вложенные ключи в объекте.

### Поведение при отсутствии значения

Если путь не найден (несуществующий ключ или невалидный JSON), плейсхолдер остаётся в тексте без изменений:

```python
text = "Данные: {missing.path}"
variables = {}
# → "Данные: {missing.path}"
```

## check_auth

```python
# С БД
async def check_auth(user_id: int) -> bool:
    if db_pool:
        user = await get_user_from_db(user_id)
        return user is not None
    return user_id in user_data

# Без БД
async def check_auth(user_id: int) -> bool:
    return user_id in user_data
```

При `requiresAuth=true` на узле — пользователь получает `"❌ Сначала запустите бота: /start"` если не зарегистрирован.

## Тесты

```bash
npx vitest run --config vitest.lib.config.ts lib/templates/utils
```

## Файлы

```
utils/
├── utils.py.jinja2             # Шаблон
├── utils-template.params.ts    # Типы параметров
├── utils-template.schema.ts    # Zod схема
├── utils-template.renderer.ts  # Функция генерации
├── utils-template.fixture.ts   # Тестовые данные
├── utils-template.test.ts      # Тесты (vitest)
├── utils-template.md           # Документация
└── index.ts                    # Публичный экспорт
```

## См. также

- [`middleware.py.jinja2`](../middleware/) — `register_user_middleware` использует те же поля
- [`message.py.jinja2`](../message/) — вызывает `init_user_variables` при первом показе сообщения
`navigate_to_node(message, node_id, text=None, reply_markup=None)` доступна всегда как общий helper навигации и используется для перехода между узлами.
