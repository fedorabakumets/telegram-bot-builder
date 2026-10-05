# Шаблон узла `psql_query`

Генерирует Python-обработчик для выполнения прямого SQL-запроса к PostgreSQL через `asyncpg`.

## Параметры

| Параметр         | Тип                                    | Описание                                          |
|------------------|----------------------------------------|---------------------------------------------------|
| `nodeId`         | `string`                               | ID узла в графе бота                              |
| `query`          | `string`                               | SQL. `{имя}` — параметр asyncpg, не вклейка текста |
| `saveResultTo`   | `string`                               | Переменная для сохранения результата (или `""`)   |
| `resultFormat`   | `json \| text \| first_row \| affected` | Формат обработки результата                       |
| `textTemplate`   | `string`                               | Шаблон строки для формата `text`                  |
| `autoTransitionTo` | `string`                             | ID следующего узла для автоперехода (или `""`)    |
| `connectionSource` | `string` | ❌ | `builtin` / `env` / `custom` — источник подключения |
| `connectionEnvVar` | `string` | ❌ | Имя переменной окружения (при `env`) |
| `connectionString` | `string` | ❌ | Прямой URL подключения (при `custom`) |
| `builtinEnabled` | `boolean` | ❌ | Разрешён ли `builtin` (по умолчанию `true`; сервер передаёт `PSQL_BUILTIN_ENABLED`) |
| `panelDsnDenied` | `boolean` | ❌ | Запрещён ли `env` с переменной `DATABASE_URL` (по умолчанию `false`; сервер передаёт `PSQL_PANEL_DSN_DENIED`) |

## Форматы результата

- **`first_row`** — первая строка как словарь `{}`
- **`json`** — все строки как список словарей `[{}, ...]`
- **`text`** — строки форматируются через `textTemplate` и объединяются через `\n`
- **`affected`** — строка с количеством затронутых строк (из `execute`)

## Параметры в SQL

`{имя}` в `query` генератор заменяет на `$1`, `$2`, … и передаёт значения отдельным списком: `await _conn.fetch(_query, *_args)` (то же для `fetchrow` и `execute`). Запрос без скобок идёт без аргументов.

- Одинаковое имя — один номер, порядок первого вхождения.
- Имена те же, что в текстах: буквы, цифры, `_`, точка, индекс (`{a.b}`, `{a.b[0]}`), а также `now`, `today`, `time`, `__now`. Нет переменной — в аргумент попадает `None`.
- Значение передаётся как есть, без приведения к числу. Для целой колонки: `WHERE id = {user_id}::bigint`.
- Запись `'{name}'` (одинарные кавычки вплотную) тоже параметр, кавычки снимаются. Двойные кавычки и пробел внутри кавычек не снимаются.
- Подстрока: `WHERE name ILIKE '%' || {q} || '%'`. Массив: `WHERE id = ANY({ids})`.
- `LIKE '%{q}%'` ломается: скобки становятся `$n` внутри строки, поиск по подстроке не выполняется.
- `FROM {таблица}` станет параметром и упадёт при выполнении. Имя таблицы пишется буквами в тексте запроса.
- `{#each}` и `{=выражение}` в SQL не раскрываются.
- `textTemplate` при формате `text` не меняется: это текст сообщения, `{name}` там подставляется в строку.

Перед запросом, внутри уже открытого соединения и транзакции, выполняется `SET LOCAL statement_timeout = '15s'`. В поля узла таймаут не выносится.

## Пример входных данных

```typescript
const params: PsqlQueryTemplateParams = {
  nodeId: 'pq_leaderboard',
  query: 'SELECT name, score FROM users ORDER BY score DESC LIMIT 10',
  saveResultTo: 'leaderboard',
  resultFormat: 'text',
  textTemplate: '{name} — {score}',
  autoTransitionTo: 'msg_result',
};
```

## Пример выходного Python-кода

```python
@dp.callback_query(lambda c: c.data == "pq_leaderboard")
async def handle_callback_pq_leaderboard(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Узел psql_query: выполняет SQL-запрос к базе данных."""
    try:
        user_id = callback_query.from_user.id
        if db_pool is None:
            logging.warning(f"⚠️ psql_query [pq_leaderboard]: db_pool недоступен, пропускаем")
            return
        _all_vars = await init_all_user_vars(user_id)
        _query = "SELECT name, score FROM users ORDER BY score DESC LIMIT 10"
        async with db_pool.acquire() as _conn:
            async with _conn.transaction():
                await _conn.execute("SET LOCAL statement_timeout = '15s'")
                _rows = await _conn.fetch(_query)
            _result = [dict(r) for r in _rows]
        _lines = []
        for _r in _result:
            _line = replace_variables_in_text("{name} — {score}", _r)
            _lines.append(_line)
        user_data[user_id]["leaderboard"] = "\n".join(_lines)
        await set_user_var(user_id, "leaderboard", user_data[user_id]["leaderboard"])
        logging.info(f"✅ psql_query [pq_leaderboard]: выполнено для {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка в psql_query [pq_leaderboard]: {e}")
```

Запрос `WHERE name = '{name}' AND id = {id}` в коде выглядит так:

```python
_query = "SELECT * FROM orders WHERE name = $1 AND id = $2"
_args = [_psql_param("name", _all_vars), _psql_param("id", _all_vars), ]
_row = await _conn.fetchrow(_query, *_args)
```

## Использование API

```typescript
import { generatePsqlQueryHandlers, collectPsqlQueryEntries } from './psql-query';

// Генерация Python-кода для всех psql_query узлов
const code = generatePsqlQueryHandlers(nodes);

// builtin запрещён: узлы builtin генерируют заглушку без обращения к db_pool
const safeCode = generatePsqlQueryHandlers(nodes, { builtinEnabled: false });

// env DATABASE_URL запрещён сервером; свои переменные и custom не затрагиваются
const deniedPanel = generatePsqlQueryHandlers(nodes, { panelDsnDenied: true });

// Только сбор параметров (без рендеринга)
const entries = collectPsqlQueryEntries(nodes);
```

## Подключение к внешней БД

Параметр `connectionSource` определяет способ подключения к базе данных:

### `builtin` (если `connectionSource` не задан)

Используется встроенный пул `db_pool` (БД платформы), который создаётся при старте бота. Если `db_pool` недоступен — обработчик завершается без ошибки.

При `builtinEnabled: false` (на сервере — по умолчанию, пока не задан `PSQL_BUILTIN_ENABLED=true`) обработчик не обращается к `db_pool`: пишет в лог `⛔ ... подключение к БД платформы отключено администратором` и завершается.

### `env`

Подключение через переменную окружения. В `connectionEnvVar` указывается имя переменной, содержащей connection string. Пул создаётся на лету и закрывается после выполнения запроса.

Серверный флаг `PSQL_PANEL_DSN_DENIED` по умолчанию выключен (`panelDsnDenied: false`): сгенерированный код тот же, что и без флага. Когда администратор включает флаг и бот пересобирается, режим `env` не подключается, если имя переменной — `DATABASE_URL` без учёта регистра. В лог пишется то же сообщение, что у выключенного builtin (`подключение к БД платформы отключено администратором`), запрос не выполняется. Своя переменная (`MY_DB`, `BOT_DATABASE_URL`) и режим `custom` продолжают работать. Режим `builtin` по-прежнему зависит только от `PSQL_BUILTIN_ENABLED`.

Для `env` и `custom` строка проходит через `_psql_safe_dsn` (генерируется один раз на бота, шаблон `psql-query-dsn.py.jinja2`). Нужна схема `postgres`/`postgresql` и явный хост, параметры `host`/`hostaddr`/`passfile`/`service` в query запрещены. Без пароля в адресе передаётся `password=""`, чтобы asyncpg не подставил `PGHOST`/`PGPASSWORD`/`~/.pgpass` из окружения воркера. Если строка отклонена, запрос не выполняется.

```typescript
{
  connectionSource: 'env',
  connectionEnvVar: 'MY_EXTERNAL_DB',
  connectionString: '',
}
```

### `custom`

Прямое подключение по URL. В `connectionString` указывается полный connection string. Пул создаётся на лету и закрывается после выполнения запроса.

```typescript
{
  connectionSource: 'custom',
  connectionEnvVar: '',
  connectionString: 'postgresql://user:pass@host:5432/dbname',
}
```
