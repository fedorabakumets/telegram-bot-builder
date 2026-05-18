# Шаблон: загрузка контента (_content)

## Описание

Генерирует Python-код для загрузки контента из таблицы `_content` в сгенерированном боте.
Включается только при наличии `projectId` у проекта.

Функциональность:
- При старте бота — загрузка всех записей из `_content` в словарь-кэш
- Функция `get_content(key, fallback)` для получения значения по ключу
- Фоновая перезагрузка кэша каждые N секунд (asyncio task)

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|:---:|:---:|----------|
| `projectId` | `number` | ✅ | — | ID проекта для запроса к БД |
| `reloadIntervalSeconds` | `number` | ❌ | `60` | Интервал перезагрузки кэша (мин. 10) |

## Пример входных данных

```ts
{
  projectId: 245,
  reloadIntervalSeconds: 60
}
```

## Пример выходного Python-кода

```python
# ═══ Загрузка контента из таблицы _content ═══

_content_cache: dict = {}
_content_table_id: int | None = None

async def load_content(pool):
    """Загрузка контента из таблицы _content при старте"""
    global _content_table_id
    try:
        row = await pool.fetchrow(
            "SELECT id FROM bot_tables WHERE project_id = $1 AND name = '_content'",
            245
        )
        if not row:
            return
        _content_table_id = row["id"]
        await reload_content(pool)
    except Exception as e:
        logging.warning(f"Не удалось загрузить таблицу контента: {e}")

async def reload_content(pool):
    ...

def get_content(key: str, fallback: str = "") -> str:
    """Получить контент по ключу с fallback на значение по умолчанию"""
    return _content_cache.get(key, fallback)

async def _content_reload_loop(pool):
    """Фоновая перезагрузка кэша контента каждые 60 сек"""
    while True:
        await asyncio.sleep(60)
        await reload_content(pool)
```

## API использования

```ts
import { generateContentCode } from './templates/content';

// Генерация кода (только если есть projectId)
const code = context.projectId
  ? generateContentCode({ projectId: context.projectId, reloadIntervalSeconds: 60 })
  : '';
```
