# psql_query — SQL-запрос к PostgreSQL

```json
{
  "type": "psql_query",
  "data": {
    "query": "SELECT balance FROM users WHERE telegram_id = {user_id}",
    "saveResultTo": "db_result",
    "resultFormat": "first_row",
    "textTemplate": "",
    "enableAutoTransition": true,
    "autoTransitionTo": "next_node_id",
    "connectionSource": "env",
    "connectionEnvVar": "MY_DB_URL",
    "connectionString": ""
  }
}
```

| Поле | Описание |
|------|----------|
| `query` | SQL. `{имя}` — параметр asyncpg, не вклейка текста. См. правила ниже |
| `saveResultTo` | Имя переменной для результата |
| `resultFormat` | `"first_row"` — первая строка как объект, `"all_rows"` — массив, `"scalar"` — одно значение |
| `connectionSource` | `"env"` — своя БД пользователя из переменной бота (по умолчанию), `"custom"` — строка подключения вручную, `"builtin"` — БД платформы (**только если администратор задал `PSQL_BUILTIN_ENABLED=true`**) |
| `connectionEnvVar` | Имя переменной бота (вкладка «Бот» → переменные) со строкой `postgresql://user:pass@host:5432/db` — при `env` |
| `connectionString` | Строка подключения — при `custom` |

> ⚠️ **Подключение к БД:** по умолчанию режим `builtin` выключен — узел с ним не выполняет запрос и пишет в лог «подключение к БД платформы отключено администратором». Всегда используй `"connectionSource": "env"` и попроси пользователя добавить переменную бота (например `MY_DB_URL`) со строкой подключения к **своей** базе (Neon, Supabase, Railway и т.п.). Строка должна содержать явный хост; пустая строка, адрес без хоста и параметры `host`/`hostaddr`/`passfile`/`service` в query отклоняются — запрос не выполняется.

Серверный флаг `PSQL_PANEL_DSN_DENIED` по умолчанию выключен и в JSON не пишется. Пока он выключен, режим `env` с `DATABASE_URL` работает как раньше. Когда администратор включает флаг и пересобирает бота, `connectionEnvVar` со значением `DATABASE_URL` (без учёта регистра) не выполняет запрос. Свои имена (`MY_DB`, `BOT_DATABASE_URL`) и режим `custom` при включённом флаге работают.

#### Как писать `{переменные}` в SQL

`{имя}` в `query` — это параметр (`$1`, `$2`, …), а не подстановка текста. Значение уходит в `fetch` / `fetchrow` / `execute` отдельно. Кавычка в тексте пользователя не может дописать команду. В запрос пиши скобки без своих `$1`.

Правила для автора запроса:

- Повтор того же имени — один параметр: `WHERE a = {name} OR b = {name}`.
- Имя: буквы, цифры, `_`, точка и индекс, как в текстах сообщений: `{user_id}`, `{a.b}`, `{a.b[0]}`, `{now}`, `{today}`, `{time}`, `{__now}`. Нет переменной — в параметр попадает `NULL`, скобки в SQL не остаются.
- Число не угадывается: в параметр уходит значение как есть. Колонка `bigint`, а переменная может быть текстом — приведи тип в SQL: `WHERE telegram_id = {user_id}::bigint`.
- Старая форма с кавычками вплотную тоже параметр, кавычки не нужны: пиши `WHERE name = {name}`, не `WHERE name = '{name}'`.
- Поиск по подстроке: `WHERE name ILIKE '%' || {q} || '%'`. Массив: `WHERE id = ANY({ids})`.
- Не пиши `LIKE '%{q}%'` и `IN ({ids})`. Проценты и кавычки вокруг скобок оставляют `$n` внутри строки, условие перестаёт искать подстроку.
- Имя таблицы и столбца из переменной не работает: `FROM {table}` станет параметром и упадёт. Имя таблицы пиши буквами в тексте запроса.
- `{#each}` и `{=выражение}` в SQL не раскрываются. Посчитай выражение узлом `set_variable` и подставь имя переменной.
- `textTemplate` при `resultFormat: "text"` — это текст сообщения, не SQL. Там `{name}` по-прежнему подставляется в строку.

Запрос без скобок выполняется без параметров. Лимит одного запроса — 15 секунд, в настройках узла его нет.

#### Примеры SQL

Создание таблицы:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  telegram_id BIGINT PRIMARY KEY,
  balance INT DEFAULT 100,
  reputation INT DEFAULT 100,
  bio TEXT DEFAULT ''
)
```

Вставка/обновление:
```sql
INSERT INTO profiles (telegram_id, balance) VALUES ({user_id}, 100)
ON CONFLICT (telegram_id) DO NOTHING
```

Обновление поля:
```sql
UPDATE profiles SET reputation = reputation + 10 WHERE telegram_id = {target_user_id}
```

Выборка:
```sql
SELECT balance, reputation FROM profiles WHERE telegram_id = {user_id}
```
