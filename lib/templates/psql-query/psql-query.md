# Шаблон узла `psql_query`

Генерирует Python-обработчик для выполнения прямого SQL-запроса к PostgreSQL через `asyncpg`.

## Параметры

| Параметр         | Тип                                    | Описание                                          |
|------------------|----------------------------------------|---------------------------------------------------|
| `nodeId`         | `string`                               | ID узла в графе бота                              |
| `query`          | `string`                               | SQL-запрос, поддерживает `{переменные}`           |
| `saveResultTo`   | `string`                               | Переменная для сохранения результата (или `""`)   |
| `resultFormat`   | `json \| text \| first_row \| affected` | Формат обработки результата                       |
| `textTemplate`   | `string`                               | Шаблон строки для формата `text`                  |
| `autoTransitionTo` | `string`                             | ID следующего узла для автоперехода (или `""`)    |
| `connectionSource` | `string` | ❌ | `builtin` / `env` / `custom` — источник подключения |
| `connectionEnvVar` | `string` | ❌ | Имя переменной окружения (при `env`) |
| `connectionString` | `string` | ❌ | Прямой URL подключения (при `custom`) |

## Форматы результата

- **`first_row`** — первая строка как словарь `{}`
- **`json`** — все строки как список словарей `[{}, ...]`
- **`text`** — строки форматируются через `textTemplate` и объединяются через `\n`
- **`affected`** — строка с количеством затронутых строк (из `execute`)

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
        _query = replace_variables_in_text("SELECT name, score FROM users ...", _all_vars)
        async with db_pool.acquire() as _conn:
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

## Использование API

```typescript
import { generatePsqlQueryHandlers, collectPsqlQueryEntries } from './psql-query';

// Генерация Python-кода для всех psql_query узлов
const code = generatePsqlQueryHandlers(nodes);

// Только сбор параметров (без рендеринга)
const entries = collectPsqlQueryEntries(nodes);
```

## Подключение к внешней БД

Параметр `connectionSource` определяет способ подключения к базе данных:

### `builtin` (по умолчанию)

Используется встроенный пул `db_pool`, который создаётся при старте бота. Если `db_pool` недоступен — обработчик завершается без ошибки.

### `env`

Подключение через переменную окружения. В `connectionEnvVar` указывается имя переменной, содержащей connection string. Пул создаётся на лету и закрывается после выполнения запроса.

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
