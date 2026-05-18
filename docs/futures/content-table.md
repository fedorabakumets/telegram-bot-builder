# Фича: Таблица контента (_content)

## Концепция

Автоматическая таблица `_content` на уровне проекта — единый реестр всего редактируемого контента бота: тексты сообщений, подписи к медиа, тексты кнопок, URL ссылок, URL медиа, эндпоинты API, описания команд. Двусторонняя синхронизация с JSON сценария. Бот читает контент из таблицы (с кэшем) — горячая перезагрузка без рестарта.

## Проблема

- Контент зашит в JSON сценария — чтобы изменить URL или текст, нужно открыть ноду
- Нет единого места где видны все тексты, ссылки и медиа бота
- Не-программисты не могут менять контент без понимания визуального редактора
- Нет горячей перезагрузки без рестарта бота
- При смене домена/API нужно обходить все ноды вручную

## Решение

### Таблица `_content`

Специальная пользовательская таблица (bot_table) с зарезервированным именем `_content`. Создаётся автоматически при создании проекта.

Структура:
| Колонка | Описание |
|---------|----------|
| key | Уникальный ключ (формат: `node_id[.тип.sub_id]`) |
| type | Тип контента: `message`, `caption`, `button`, `url`, `media_url`, `api_url`, `command`, `prompt` |
| sheet | Имя листа (для группировки) |
| label | Человекочитаемое описание |
| value | Значение (текст, URL и т.д.) |

### Что синхронизируется

| Источник в ноде | type | Формат key |
|-----------------|------|------------|
| `messageText` | message | `{node_id}` |
| `mediaCaption` | caption | `{node_id}.caption` |
| `buttons[].text` | button | `{node_id}.btn.{btn_id}` |
| `buttons[].url` | url | `{node_id}.btn.{btn_id}.url` |
| `buttons[].webAppUrl` | url | `{node_id}.btn.{btn_id}.webapp` |
| `imageUrl` / `videoUrl` / `audioUrl` / `documentUrl` | media_url | `{node_id}.media` |
| `httpRequestUrl` | api_url | `{node_id}.api` |
| `command_trigger.description` | command | `{node_id}.desc` |
| `inputPrompt` (collectUserInput) | prompt | `{node_id}.prompt` |

### Пример таблицы

| key | type | sheet | label | value |
|-----|------|-------|-------|-------|
| msg-welcome | message | 🏠 Старт | 👋 Добро пожаловать... | 👋 Добро пожаловать, {first_name}! |
| msg-welcome.btn.btn1 | button | 🏠 Старт | 🔘 О нас | О нас |
| msg-welcome.btn.btn2 | button | 🏠 Старт | 🔘 Сайт | Сайт |
| msg-welcome.btn.btn2.url | url | 🏠 Старт | 🔗 Сайт | https://example.com |
| photo-1.media | media_url | 🏠 Старт | 🖼 Фото приветствия | https://example.com/welcome.jpg |
| http-api.api | api_url | ⚙️ API | 🌐 Получение данных | https://api.example.com/users |
| cmd-start.desc | command | 🏠 Старт | 📋 /start | Запустить бота |
| msg-ask-age.prompt | prompt | 🏠 Старт | ❓ Ввод возраста | Введите ваш возраст: |

### Синхронизация: Сценарий → Таблица

При сохранении проекта (PUT /api/projects/:id) сервер:
1. Проходит по всем нодам всех листов
2. Извлекает контент по правилам маппинга (таблица выше)
3. Upsert каждого элемента в `_content`
4. Удаляет строки, чьи key не найдены в сценарии (нода/кнопка удалена)

### Синхронизация: Таблица → Сценарий

При изменении строки в `_content` (через API таблиц):
1. Парсит `key` и `type`:
   - `node_id` + type=message → обновляет `messageText`
   - `node_id.caption` → обновляет `mediaCaption`
   - `node_id.btn.btn_id` + type=button → обновляет `buttons[].text`
   - `node_id.btn.btn_id.url` → обновляет `buttons[].url`
   - `node_id.media` → обновляет `imageUrl`/`videoUrl`/etc
   - `node_id.api` → обновляет `httpRequestUrl`
   - `node_id.desc` → обновляет `command_trigger.description`
   - `node_id.prompt` → обновляет `inputPrompt`
2. Сохраняет проект

### Бот: чтение контента из БД

В сгенерированном Python-коде:

```python
import asyncio
from typing import Dict

# Кэш контента
_content_cache: Dict[str, str] = {}
_content_table_id: int | None = None

async def load_content(pool):
    """Загрузка контента из таблицы _content при старте"""
    global _content_table_id
    row = await pool.fetchrow(
        "SELECT id FROM bot_tables WHERE project_id = $1 AND name = '_content'",
        PROJECT_ID
    )
    if not row:
        return
    _content_table_id = row["id"]
    await reload_content(pool)

async def reload_content(pool):
    """Перезагрузка кэша контента"""
    if not _content_table_id:
        return
    rows = await pool.fetch(
        "SELECT data FROM bot_table_rows WHERE table_id = $1",
        _content_table_id
    )
    _content_cache.clear()
    for r in rows:
        data = r["data"]
        if data.get("key") and data.get("value"):
            _content_cache[data["key"]] = data["value"]

def get_content(key: str, fallback: str = "") -> str:
    """Получить контент по ключу (с fallback на захардкоженный)"""
    return _content_cache.get(key, fallback)

# Периодическая перезагрузка (каждые 60 сек)
async def content_reload_loop(pool):
    while True:
        await asyncio.sleep(60)
        await reload_content(pool)
```

Использование в шаблонах:
```python
# Текст сообщения
text = get_content("msg-welcome", "👋 Привет, {first_name}!")
text = resolve_variables(text, variables)

# URL кнопки
btn_url = get_content("msg-welcome.btn.btn2.url", "https://example.com")

# URL медиа
photo_url = get_content("photo-1.media", "https://example.com/default.jpg")

# API эндпоинт
api_url = get_content("http-api.api", "https://api.example.com/data")
```

Fallback гарантирует что бот работает даже если таблица пуста или удалена.

## UI

### Вкладка "Таблицы"

Таблица `_content` отображается в секции "Пользовательские (проект)" с особой иконкой:
```
ПОЛЬЗОВАТЕЛЬСКИЕ (ПРОЕКТ)
  ✏️ Контент (авто)    47
  📝 profiles
  📝 relationships
```

Отличия от обычных таблиц:
- Нельзя удалить таблицу
- Нельзя добавлять/удалять колонки
- Можно добавлять строки вручную (для контента не привязанного к нодам)
- Колонка `value` — расширенный редактор (многострочный для текстов, однострочный для URL)
- Колонки `key`, `type` — read-only
- Фильтр по `type` (показать только тексты / только URL / только кнопки)
- Фильтр по `sheet` (показать только контент конкретного листа)

### Редактор ноды

В панели свойств ноды рядом с полями контента — индикатор:
- 🔗 "Синхронизировано с таблицей контента"
- При редактировании в ноде — таблица обновляется при сохранении проекта

## Порядок реализации

### Фаза 1: Бэкенд

1. При создании проекта — автоматически создавать таблицу `_content` с колонками (key, type, sheet, label, value)
2. При сохранении проекта — синхронизировать контент из нод в `_content`
3. API: при обновлении строки в `_content` — обновлять соответствующее поле в JSON сценария

### Фаза 2: Генератор бота

4. В шаблоне бота — загрузка контента из `_content` при старте
5. Использовать `get_content(key, fallback)` вместо хардкода
6. Фоновая перезагрузка каждые 60 секунд

### Фаза 3: UI

7. Отображение `_content` как особой таблицы в списке
8. Фильтры по type и sheet
9. Расширенный редактор для колонки `value`
10. Индикатор синхронизации в панели свойств ноды

## Ограничения

- Максимум 1000 записей на проект
- Ключ содержит node_id — при дублировании ноды создаётся новая запись
- SQL-запросы (`psql_query.query`) не синхронизируются (слишком сложная структура)
- Тела HTTP-запросов (`httpRequestBody`) не синхронизируются (JSON внутри JSON)

## Совместимость

- Старые проекты без `_content` работают как раньше (fallback на хардкод)
- Таблица создаётся при первом сохранении проекта после обновления
- Генератор бота проверяет наличие таблицы — если нет, работает по-старому
