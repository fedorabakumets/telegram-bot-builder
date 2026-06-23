<!-- @fileoverview План реализации нового типа узла `set_variable` для BotCraft Studio.
     Описывает проблему, концепцию, сценарии использования, структуру JSON,
     этапы реализации, генерируемый Python-код и граничные случаи. -->

# Узел `set_variable` — установка переменных без HTTP-запроса

## 1. Проблема

Сейчас в BotCraft переменные создаются только двумя способами:

| Способ | Ограничение |
|--------|-------------|
| `http_request` + `httpRequestResponseVariable` | Нужен внешний апишник, даже для простых операций |
| `input` + `inputVariable` | Только ввод от пользователя |

Это создаёт реальные проблемы в повседневных сценариях:

**Пример 1 — переупаковка данных.** HTTP-ответ вернул `{ "user": { "name": "Иван", "age": 30 } }`.
Нужно положить `user.name` в отдельную переменную `display_name` для использования в тексте.
Сейчас — только через ещё один HTTP-запрос к своему апишнику.

**Пример 2 — вычисление строки.** Нужно собрать приветствие `"Привет, {first_name} {last_name}!"` и
сохранить в `greeting` для переиспользования в нескольких узлах. Невозможно без апишника.

**Пример 3 — счётчик.** Нужно увеличить переменную `step` на 1 при каждом шаге wizard-флоу.
Сейчас — только через внешний API или костыль с `input`-узлом.

**Пример 4 — константы.** Нужно задать `base_url = "https://api.example.com"` один раз в начале
флоу и переиспользовать. Нет способа сделать это без HTTP-запроса.

---

## 2. Концепция

Узел `set_variable` позволяет создавать и изменять переменные прямо в flow-редакторе,
без внешних запросов. Поддерживает статические значения, шаблоны с `{переменными}` и
простые выражения.

### Как выглядит в UI редактора

```
┌─────────────────────────────────────────┐
│  📝 Установить переменные               │
├─────────────────────────────────────────┤
│  Переменная        Значение             │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ greeting     │  │ Привет, {first_  │ │
│  └──────────────┘  │ name}!           │ │
│                    └──────────────────┘ │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ step         │  │ 1                │ │
│  └──────────────┘  └──────────────────┘ │
│                                         │
│  [+ Добавить переменную]                │
│                                         │
│  Следующий узел: [next-node ▼]          │
└─────────────────────────────────────────┘
```

Каждая строка — пара `имя переменной` / `значение`. Значение поддерживает:
- Статическую строку: `"Привет"`
- Шаблон с переменными: `"Привет, {first_name}!"`
- Вложенный путь: `"{response.data.user.name}"`
- Числа и булевы: `"42"`, `"true"`

---

## 3. Сценарии использования

### 3.1 Установка константы в начале флоу

```json
{
  "id": "set-config",
  "type": "set_variable",
  "position": { "x": 100, "y": 100 },
  "data": {
    "assignments": [
      { "id": "a1", "variable": "api_base", "value": "https://api.example.com/v2" },
      { "id": "a2", "variable": "max_retries", "value": "3" }
    ],
    "autoTransitionTo": "fetch-data"
  }
}
```

### 3.2 Сборка приветственного сообщения

```json
{
  "assignments": [
    { "id": "a1", "variable": "greeting", "value": "Привет, {first_name} {last_name}!" },
    { "id": "a2", "variable": "user_tag", "value": "@{username}" }
  ]
}
```

Генерируемый Python:
```python
user_vars["greeting"] = resolve_var("Привет, {first_name} {last_name}!", user_vars)
user_vars["user_tag"] = resolve_var("@{username}", user_vars)
```

### 3.3 Извлечение вложенного поля из HTTP-ответа

```json
{
  "assignments": [
    { "id": "a1", "variable": "user_name", "value": "{profile.data.name}" },
    { "id": "a2", "variable": "user_email", "value": "{profile.data.contacts.email}" }
  ]
}
```

### 3.4 Счётчик шагов wizard-флоу

```json
{
  "assignments": [
    { "id": "a1", "variable": "wizard_step", "value": "1" }
  ]
}
```

На следующем шаге — отдельный узел `set_variable` с `"value": "2"` и т.д.

### 3.5 Формирование URL с параметрами

```json
{
  "assignments": [
    {
      "id": "a1",
      "variable": "export_url",
      "value": "https://api.example.com/export?user={user_id}&format=json"
    }
  ]
}
```

### 3.6 Переупаковка данных перед отправкой

```json
{
  "assignments": [
    { "id": "a1", "variable": "order_id", "value": "{order.result.id}" },
    { "id": "a2", "variable": "order_total", "value": "{order.result.price} руб." },
    { "id": "a3", "variable": "order_status", "value": "{order.result.status}" }
  ]
}
```

### 3.7 Установка флага состояния

```json
{
  "assignments": [
    { "id": "a1", "variable": "is_premium", "value": "true" },
    { "id": "a2", "variable": "subscription_plan", "value": "pro" }
  ]
}
```

Используется в `condition`-узле: `variable: "is_premium"`, `operator: "equals"`, `value: "true"`.

### 3.8 Сброс переменных

```json
{
  "assignments": [
    { "id": "a1", "variable": "cart_items", "value": "" },
    { "id": "a2", "variable": "cart_total", "value": "0" },
    { "id": "a3", "variable": "checkout_step", "value": "1" }
  ]
}
```

---

## 4. Структура узла в `project.json`

```json
{
  "id": "set-greeting",
  "type": "set_variable",
  "position": { "x": 400, "y": 200 },
  "data": {
    "assignments": [
      {
        "id": "assign-1",
        "variable": "greeting",
        "value": "Привет, {first_name}! Добро пожаловать."
      },
      {
        "id": "assign-2",
        "variable": "user_tag",
        "value": "@{username}"
      },
      {
        "id": "assign-3",
        "variable": "session_start",
        "value": "active"
      }
    ],
    "autoTransitionTo": "msg-welcome",
    "enableAutoTransition": true
  }
}
```

### Схема поля `assignments`

| Поле | Тип | Обязательное | Описание |
|------|-----|:---:|---------|
| `id` | `string` | ✅ | Уникальный ID присваивания внутри узла |
| `variable` | `string` | ✅ | Имя переменной (латиница, `_`, цифры) |
| `value` | `string` | ✅ | Значение: статика или шаблон с `{переменными}` |

---

## 5. Этапы реализации

### 5.1 Схема узла (`shared/schema/tables/node-schema.ts`)

- [ ] Добавить `'set_variable'` в `z.enum([...])` поля `type` узла
- [ ] Добавить поле `assignments` в `data`:

```typescript
// shared/schema/tables/node-schema.ts
/** Присваивания переменных для узла set_variable */
assignments: z.array(z.object({
  /** Уникальный идентификатор присваивания */
  id: z.string(),
  /** Имя переменной для записи */
  variable: z.string(),
  /** Значение или шаблон с {переменными} */
  value: z.string(),
})).default([]),
```

### 5.2 UI компонент в редакторе свойств

- [ ] Создать `client/components/editor/properties/SetVariableProperties.tsx`
- [ ] Добавить компонент строки присваивания `AssignmentRow.tsx`
- [ ] Зарегистрировать в маппинге типов узлов → панель свойств
- [ ] Добавить иконку и метку `"Установить переменные"` в палитру узлов

Примерная структура компонента:

```typescript
// client/components/editor/properties/SetVariableProperties.tsx
/**
 * @fileoverview Панель свойств узла set_variable — редактирование присваиваний переменных
 * @module client/components/editor/properties/SetVariableProperties
 */

/** Строка присваивания: имя переменной + значение */
interface AssignmentRowProps {
  /** Данные присваивания */
  assignment: { id: string; variable: string; value: string };
  /** Обработчик изменения */
  onChange: (id: string, field: 'variable' | 'value', val: string) => void;
  /** Обработчик удаления */
  onRemove: (id: string) => void;
}
```

### 5.3 Шаблон генератора Python (`lib/templates/set-variable/`)

- [ ] Создать директорию `lib/templates/set-variable/`
- [ ] Создать `set-variable.schema.ts` — Zod-схема параметров шаблона
- [ ] Создать `set-variable.params.ts` — маппинг `NodeData → SetVariableParams`
- [ ] Создать `set-variable.py.jinja2` — Jinja2-шаблон генерации Python-кода
- [ ] Создать `set-variable.renderer.ts` — рендерер шаблона
- [ ] Создать `set-variable.fixture.ts` — фикстуры для тестов
- [ ] Создать `set-variable.test.ts` — тесты шаблона
- [ ] Создать `index.ts` — экспорт

Структура по аналогии с `lib/templates/http-request/` (см. существующий шаблон).

### 5.4 Регистрация в генераторе (`lib/bot-generator.ts`)

- [ ] Импортировать рендерер `setVariableRenderer`
- [ ] Добавить `case 'set_variable':` в switch-блок обработки типов узлов
- [ ] Убедиться что `autoTransitionTo` обрабатывается стандартным образом

### 5.5 Документация (`docs/bot-json-prompt.md`)

- [ ] Добавить раздел `### set_variable — установить переменные` в секцию типов узлов
- [ ] Описать поле `assignments` с примером JSON
- [ ] Добавить в таблицу типов узлов строку `set_variable`

### 5.6 Интеграционные тесты

- [ ] Тест: узел с одним присваиванием генерирует корректный Python
- [ ] Тест: узел с несколькими присваиваниями — все переменные устанавливаются
- [ ] Тест: шаблон `{first_name}` корректно резолвится через `resolve_var`
- [ ] Тест: вложенный путь `{response.data.name}` корректно резолвится
- [ ] Тест: пустое значение `""` устанавливает переменную в пустую строку
- [ ] Тест: `autoTransitionTo` генерирует переход на следующий узел

---

## 6. Генерируемый Python-код

### Шаблон `set-variable.py.jinja2`

```jinja2
{# Шаблон узла set_variable — установка переменных пользователя #}
async def handle_{{ nodeId|safe_name }}({{ handler_args }}):
    """Узел set_variable: устанавливает переменные пользователя."""
    {% for assignment in assignments %}
    user_vars[{{ assignment.variable|tojson }}] = resolve_var(
        {{ assignment.value|tojson }}, user_vars
    )
    {% endfor %}
    {% if autoTransitionTo %}
    await handle_{{ autoTransitionTo|safe_name }}({{ handler_args }})
    {% endif %}
```

### Пример генерируемого кода для узла из раздела 3.2

```python
async def handle_set_greeting(callback_query, user_vars, bot):
    """Узел set_variable: устанавливает переменные пользователя."""
    user_vars["greeting"] = resolve_var(
        "Привет, {first_name} {last_name}!", user_vars
    )
    user_vars["user_tag"] = resolve_var("@{username}", user_vars)
    await handle_msg_welcome(callback_query, user_vars, bot)
```

### Функция `resolve_var` (уже существует в генерируемом коде)

```python
def resolve_var(template: str, user_vars: dict) -> str:
    """Подставляет {переменные} из user_vars в строку-шаблон."""
    import re
    def replacer(match):
        path = match.group(1).split('.')
        val = user_vars
        for key in path:
            if isinstance(val, dict):
                val = val.get(key, '')
            else:
                return ''
        return str(val) if val is not None else ''
    return re.sub(r'\{([^}]+)\}', replacer, template)
```

---

## 7. Граничные случаи

### 7.1 Вложенные переменные (`{response.data.user.name}`)

`resolve_var` уже поддерживает точечную нотацию. Если промежуточный ключ отсутствует —
подставляется пустая строка `""`, не выбрасывается исключение.

```python
# response = {"data": {"user": {"name": "Иван"}}}
user_vars["name"] = resolve_var("{response.data.user.name}", user_vars)
# → "Иван"

# response = {"data": {}}  — ключ user отсутствует
user_vars["name"] = resolve_var("{response.data.user.name}", user_vars)
# → ""  (не падает)
```

### 7.2 Массивы

Если переменная содержит массив, `resolve_var` вернёт его строковое представление.
Для работы с элементами массива используйте `{variable.0.field}` (индекс как ключ).

```python
# items = [{"name": "Товар 1"}, {"name": "Товар 2"}]
user_vars["first_item"] = resolve_var("{items.0.name}", user_vars)
# → "Товар 1"
```

### 7.3 Значение `null` / `None`

Если переменная содержит `None` или `null` из JSON — `resolve_var` вернёт `""`.
Для явной установки `null` используйте специальное значение `"__null__"` (опционально,
реализуется в шаблоне):

```python
if assignment_value == "__null__":
    user_vars[var_name] = None
else:
    user_vars[var_name] = resolve_var(assignment_value, user_vars)
```

### 7.4 Имена переменных с недопустимыми символами

Валидация на уровне UI: имя переменной должно соответствовать `^[a-zA-Z_][a-zA-Z0-9_]*$`.
В схеме Zod добавить `.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)` для поля `variable`.

### 7.5 Пустой список `assignments`

Узел с пустым `assignments` — валиден, просто выполняет переход на `autoTransitionTo`.
Генератор не выбрасывает ошибку, генерирует функцию только с переходом.

### 7.6 Циклические ссылки

`{greeting}` в значении переменной `greeting` — `resolve_var` вернёт предыдущее значение
переменной (до присваивания), так как чтение и запись не атомарны. Порядок присваиваний
в `assignments` имеет значение.

---

## 8. Ссылки на файлы для изменений

| Файл | Что изменить |
|------|-------------|
| `shared/schema/tables/node-schema.ts` | Добавить `set_variable` в enum типов, поле `assignments` |
| `lib/bot-generator.ts` | Добавить `case 'set_variable'` |
| `lib/templates/set-variable/` | Создать новую директорию шаблона |
| `docs/bot-json-prompt.md` | Добавить описание узла `set_variable` |
| `client/components/editor/properties/` | Создать `SetVariableProperties.tsx` |
