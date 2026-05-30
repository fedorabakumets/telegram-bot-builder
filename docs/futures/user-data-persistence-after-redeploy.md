# Персистентность user_data после редеплоя

## Проблема

При редеплое бота `user_data` (in-memory dict) полностью очищается. Если пользователь после редеплоя нажимает кнопку, которая ведёт на узел message **минуя** узел set_variable (например кнопка "Обновить" из результатов сравнения), то переменные типа `{compare_title}` не подставляются и отображаются как сырой текст.

### Воспроизведение

1. Бот работает, пользователь проходит через `bots-set-mode` → `bot-msg-ask-amount` — всё ок
2. Происходит редеплой → `user_data` = `{}`
3. Пользователь нажимает кнопку с `callback_data = "bot-msg-ask-amount"` напрямую (из старого сообщения)
4. `init_all_user_vars(user_id)` возвращает пустой dict
5. `replace_variables_in_text("{compare_title}...", {})` → оставляет `{compare_title}` как есть
6. Пользователь видит сырой текст переменной

### Реальный кейс (30.05.2026)

- Деплой в 01:08 МСК
- Пользователь 7733607050 (@snusmurmik) в 09:30 нажал кнопку → увидел `{compare_title}` и `{compare_title_short}` вместо заголовков

## Варианты решения

### 1. Fallback — пустая строка вместо `{var}` (быстрый фикс)

В `replace_variables_in_text` если переменная не найдена — возвращать пустую строку вместо оригинального `{var_name}`.

```python
# Было:
return resolved if resolved is not None else match.group(0)

# Стало:
return resolved if resolved is not None else ''
```

**Плюсы:** одна строка, убирает визуальный мусор  
**Минусы:** скрывает проблему, пользователь видит пустое место

### 2. Кнопки ведут через set-mode (ручная правка)

Кнопку "Обновить" направить через `bots-set-mode` / `all-set-mode` вместо прямого перехода на `bot-msg-ask-amount`.

**Плюсы:** переменные всегда установлены  
**Минусы:** нужно менять project.json каждого бота, нужно знать какой mode был

### 3. Загрузка переменных из БД при первом обращении (правильный фикс)

При вызове `init_all_user_vars(user_id)` если `user_data[user_id]` пуст — подгружать переменные из `bot_users.user_data` (jsonb поле в PostgreSQL).

```python
async def init_all_user_vars(user_id: int) -> dict:
    all_vars = dict(user_data.get(user_id, {}))
    
    # Если user_data пуст — подгружаем из БД
    if not all_vars and db_pool:
        row = await db_pool.fetchrow(
            "SELECT user_data FROM bot_users WHERE user_id = $1 AND project_id = $2 AND token_id = $3",
            user_id, PROJECT_ID, TOKEN_ID
        )
        if row and row['user_data']:
            all_vars = dict(row['user_data'])
            user_data[user_id] = all_vars  # кэшируем в память
    ...
```

**Плюсы:** решает проблему глобально, все переменные восстанавливаются  
**Минусы:** нужно убедиться что `user_data` в БД актуален (сейчас `set_user_var` пишет туда)

## Рекомендация

Комбинация **1 + 3**:
- Вариант 1 как быстрый hotfix (убрать визуальный мусор)
- Вариант 3 как правильное решение (персистентность переменных)

## Связанные файлы

- `lib/templates/utils/utils.py.jinja2` — `init_all_user_vars`, `replace_variables_in_text`
- `lib/templates/set-variable/set-variable.py.jinja2` — установка переменных
- `lib/templates/message/message.py.jinja2` — рендер сообщений
- `shared/schema/tables/bot-users.ts` — поле `user_data` jsonb
