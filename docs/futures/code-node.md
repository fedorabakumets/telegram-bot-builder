# Нода `code` — произвольный Python-код

## Концепция

Пользователь пишет Python-код прямо в редакторе конструктора. Код имеет доступ к переменным пользователя, может их читать и менять. Аналог блока «Калькулятор» в Salebot и «Code node» в n8n.

Решает проблемы, которые невозможно или неудобно решать через expression/text/lookup:
- Сортировка массивов
- Условная конкатенация строк
- Парсинг и трансформация данных
- Математические вычисления любой сложности
- Работа с JSON/списками/словарями

---

## Пример использования — сравнение курсов

```python
# Сортируем обменники по выгодности и помечаем лучший
lines = [l for l in rates_text.split('\n') if l.strip()]
lines = [l for l in lines if '<b>0</b>' not in l]  # убираем пустые курсы

# Сортируем: больше крипты = лучше
def get_rate(line):
    try:
        return float(line.split('<b>')[1].split('</b>')[0])
    except:
        return 0

lines.sort(key=get_rate, reverse=True)

# Помечаем лучший
if lines:
    lines[0] = lines[0].replace('🔸', '🏆')

rates_text = '\n'.join(lines)
```

---

## Интерфейс узла

### Поля конфигурации

| Поле | Тип | Описание |
|---|---|---|
| `code` | string (multiline) | Python-код пользователя |
| `autoTransitionTo` | string | ID следующего узла |

### Доступные переменные в коде

Код выполняется в контексте, где доступны:

| Переменная | Тип | Описание |
|---|---|---|
| Все user_data переменные | any | Доступны напрямую по имени (`rates_text`, `user_amount`, etc.) |
| `user_id` | int | Telegram ID пользователя |
| `user_data` | dict | Полный словарь переменных пользователя |
| `bot_tables` | dict | Данные таблиц проекта (read-only) |

### Запись переменных

Любое присваивание переменной автоматически сохраняется в `user_data`:

```python
# Эти переменные будут доступны в следующих узлах
result = 42
formatted_text = f"Итого: {result} ₽"
my_list = [1, 2, 3]
```

---

## Безопасность

### Уровень 1 — RestrictedPython (MVP)

Код компилируется через [RestrictedPython](https://github.com/zopefoundation/RestrictedPython) перед выполнением.

**Запрещено:**
- `import os`, `import subprocess`, `import sys`
- Доступ к `__dunder__` атрибутам (`__class__`, `__import__`, `__builtins__`)
- `exec()`, `eval()`, `compile()`
- `open()`, файловые операции
- Сетевые запросы (для этого есть http_request нода)

**Разрешено:**
- Базовый Python: переменные, циклы, условия, функции
- Строки: `.replace()`, `.split()`, `.join()`, `.strip()`, f-strings
- Списки: `.sort()`, `.append()`, `.filter()`, list comprehensions
- Словари: `.get()`, `.items()`, `.keys()`, `.values()`
- Математика: `+`, `-`, `*`, `/`, `//`, `%`, `**`
- Встроенные функции: `len()`, `range()`, `enumerate()`, `zip()`, `sorted()`, `min()`, `max()`, `round()`, `abs()`, `int()`, `float()`, `str()`, `bool()`, `list()`, `dict()`, `set()`, `tuple()`
- Модули (whitelist): `json`, `re`, `math`, `datetime`, `random`, `hashlib`, `base64`, `urllib.parse`

### Уровень 2 — Docker per Worker (production/SaaS)

Когда конструктор станет мультитенантным:
- Каждый проект в отдельном Docker-контейнере
- Code-нода может делать что угодно внутри контейнера
- Ресурсные лимиты: `--memory=256m --cpus=0.5`
- Таймаут выполнения: 30 сек (настраиваемый)

RestrictedPython остаётся как дополнительный слой защиты даже внутри Docker.

---

## Генерация Python-кода

### Шаблон `code.py.jinja2`

```python
@dp.callback_query(lambda c: c.data == "{{ nodeId }}")
async def handle_callback_{{ safeName }}(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Узел code: выполняет пользовательский Python-код."""
    user_id = callback_query.from_user.id
    await init_user_variables(user_id, callback_query.from_user)
    _all_vars = await init_all_user_vars(user_id)

    # Подготавливаем локальные переменные (все user_data доступны по имени)
    _code_locals = dict(_all_vars)
    _code_locals['user_id'] = user_id
    _code_locals['user_data'] = user_data.get(user_id, {})

    try:
        # --- Пользовательский код ---
        {{ code | indent(8) }}
        # --- Конец пользовательского кода ---

        # Сохраняем изменённые переменные обратно в user_data
        for _k, _v in _code_locals.items():
            if _k.startswith('_') or _k in ('user_id', 'user_data'):
                continue
            if _k not in _all_vars or _all_vars[_k] != _v:
                await set_user_var(user_id, _k, _v)

    except Exception as _code_err:
        logging.error(f"❌ code [{{ nodeId }}]: {_code_err}")

    {% if autoTransitionTo %}
    # Автопереход
    await handle_callback_{{ autoTransitionTo | safe_name }}(callback_query, state=state)
    {% endif %}
```

### Альтернативный подход — exec()

Если код вставляется как строка (не inline), используется `exec()` с ограниченным namespace:

```python
    _safe_builtins = {
        'len': len, 'range': range, 'enumerate': enumerate,
        'zip': zip, 'sorted': sorted, 'reversed': reversed,
        'min': min, 'max': max, 'sum': sum, 'round': round,
        'abs': abs, 'int': int, 'float': float, 'str': str,
        'bool': bool, 'list': list, 'dict': dict, 'set': set,
        'tuple': tuple, 'print': lambda *a, **kw: None,
        'isinstance': isinstance, 'type': type,
    }
    _safe_modules = {
        'json': __import__('json'),
        're': __import__('re'),
        'math': __import__('math'),
        'datetime': __import__('datetime'),
        'random': __import__('random'),
    }
    _code_globals = {'__builtins__': _safe_builtins, **_safe_modules}
    _code_locals = dict(_all_vars)

    exec(_user_code, _code_globals, _code_locals)
```

---

## UI — редактор кода

### Компонент `CodeConfiguration`

- Monaco Editor (или CodeMirror) с подсветкой Python
- Автокомплит переменных пользователя (`rates_text`, `user_amount`, etc.)
- Кнопка «Тест» — выполнить код с mock-данными и показать результат
- Подсказка с доступными переменными и функциями

```
┌─────────────────────────────────────────────────┐
│ 🐍 Python-код                                   │
├─────────────────────────────────────────────────┤
│  1 │ # Сортируем и помечаем лучший              │
│  2 │ lines = rates_text.split('\n')             │
│  3 │ lines = [l for l in lines if l.strip()]    │
│  4 │ lines.sort(key=get_rate, reverse=True)     │
│  5 │ lines[0] = lines[0].replace('🔸', '🏆')   │
│  6 │ rates_text = '\n'.join(lines)              │
├─────────────────────────────────────────────────┤
│ 📋 Доступные переменные: rates_text, user_amount│
│    exchange_result, best_rate, exchanger.name    │
│ ▶️ Тест                                         │
└─────────────────────────────────────────────────┘
```

---

## Таймаут и защита от зависания

```python
import asyncio

async def _run_user_code(code_fn, timeout=30):
    """Выполняет пользовательский код с таймаутом."""
    try:
        await asyncio.wait_for(
            asyncio.to_thread(code_fn),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logging.error(f"❌ code [nodeId]: таймаут {timeout}с")
```

Бесконечные циклы прерываются через таймаут. Значение настраивается в UI (по умолчанию 30 сек).

---

## Сравнение с конкурентами

| Платформа | Code node | Sandbox | Модули |
|---|---|---|---|
| **Salebot** | ✅ «Калькулятор» | Whitelist | Ограниченный набор |
| **n8n** | ✅ Code node (JS/Python) | AST + Task Runner | Полный Node.js / Python |
| **Botpress** | ✅ Execute Code | Контейнер | Полный Node.js |
| **ManyChat** | ❌ | — | — |
| **Наш конструктор** | 🔜 | RestrictedPython + Docker | Whitelist модулей |

---

## Этапы реализации

### Этап 1 — MVP (1-2 дня)

- [ ] Шаблон `code.py.jinja2` — inline вставка кода
- [ ] Schema + params (`code` поле, `autoTransitionTo`)
- [ ] Renderer — генерация Python-кода
- [ ] UI — textarea с подсветкой (без Monaco)
- [ ] Безопасность — `exec()` с ограниченным `__builtins__`
- [ ] Таймаут — `asyncio.wait_for` 30 сек

### Этап 2 — RestrictedPython (1 день)

- [ ] Установить `RestrictedPython` в requirements
- [ ] Компиляция кода через `compile_restricted()`
- [ ] AST-проверка запрещённых конструкций
- [ ] Whitelist модулей
- [ ] Тесты безопасности (попытки escape)

### Этап 3 — UI улучшения (2-3 дня)

- [ ] Monaco Editor с подсветкой Python
- [ ] Автокомплит переменных из проекта
- [ ] Кнопка «Тест» с mock-данными
- [ ] Панель ошибок (показывает traceback)
- [ ] Сниппеты (готовые примеры кода)

### Этап 4 — Docker isolation (отдельная задача)

- [ ] Dockerfile для worker с RestrictedPython
- [ ] `docker run` вместо `spawn python worker.py`
- [ ] Проброс логов через docker attach
- [ ] Ресурсные лимиты (memory, cpu, timeout)
- [ ] Мониторинг контейнеров в UI

---

## Примеры использования

### Форматирование числа с разделителями

```python
amount = float(user_amount)
formatted_amount = f"{amount:,.0f}".replace(',', ' ')
# 10000 → "10 000"
```

### Фильтрация и сортировка массива

```python
import json
items = json.loads(items_json) if isinstance(items_json, str) else items_json
items = [i for i in items if float(i.get('price', 0)) > 0]
items.sort(key=lambda x: float(x['price']), reverse=True)
items_json = json.dumps(items, ensure_ascii=False)
```

### Генерация текста из массива

```python
lines = []
for i, item in enumerate(exchangers_list):
    emoji = '🏆' if i == 0 else '🔸'
    lines.append(f"{emoji} {item['name']}: <b>{item['rate']}</b>")
rates_text = '\n'.join(lines)
```

### Работа с датами

```python
from datetime import datetime, timedelta
now = datetime.now()
expires = now + timedelta(hours=24)
expires_text = expires.strftime('%d.%m.%Y %H:%M')
```

### Хеширование (верификация webhook)

```python
import hashlib
expected = hashlib.sha256(f"{secret}:{user_id}".encode()).hexdigest()
is_valid = "true" if expected == received_hash else "false"
```
