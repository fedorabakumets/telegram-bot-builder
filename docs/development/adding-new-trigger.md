# Добавление нового триггера на фронтенде

Этот документ описывает все файлы, которые нужно создать или обновить при добавлении нового типа триггера в редактор сценариев.

Пример реализации: `managed_bot_updated_trigger` (Bot API 9.6).

---

## 1. Схема (shared)

### `shared/schema/tables/node-schema.ts`
Добавить новый тип в enum `type` объекта `nodeSchema`:
```ts
type: z.enum([..., 'managed_bot_updated_trigger'])
```

---

## 2. Сайдбар

### Новый файл: `client/components/editor/sidebar/massive/triggers/{name}.ts`
Определение `ComponentDefinition` — имя, описание, иконка, цвет, тип, `defaultData`.

Пример: `managed-bot-updated-trigger.ts`

### `client/components/editor/sidebar/massive/triggers/index.ts`
Добавить реэкспорт нового триггера.

### `client/components/editor/sidebar/constants.ts`
Добавить триггер в массив `components` категории `'Триггеры'`.

---

## 3. Панель свойств

### Новый файл: `client/components/editor/properties/components/trigger/{Name}Configuration.tsx`
Компонент панели свойств триггера. Содержит инфо-блок, поля для переменных и `TriggerTargetSelector`.

Пример: `ManagedBotUpdatedTriggerConfiguration.tsx`

### `client/components/editor/properties/components/main/properties-panel.tsx`
Добавить блок рендера нового компонента конфигурации:
```tsx
{isTriggerNode(selectedNode.type) && (selectedNode.type as any) === 'managed_bot_updated_trigger' && (
  <ManagedBotUpdatedTriggerConfiguration ... />
)}
```

### `client/components/editor/properties/components/layout/properties-header.tsx`
Добавить в три локальных объекта внутри файла:
- `nodeNames` — отображаемое название
- `nodeIcons` — иконка FontAwesome
- `nodeColors` — цветовые классы Tailwind

### `client/components/editor/properties/utils/node-constants.ts`
Добавить тип в массив `TRIGGER_NODE_TYPES`.

### `client/components/editor/properties/utils/node-defaults.ts`
Добавить дефолтные данные для нового типа в объект `defaults`.

### `client/components/editor/properties/utils/node-formatters.ts`
Добавить отображаемое название в объект `types` функции `getNodeTypeLabel`.

### `client/components/editor/properties/utils/variables-utils.ts`
Добавить блок извлечения переменных из нод нового типа (аналогично `callback_trigger`).

---

## 4. Канвас

### Новый файл: `client/components/editor/canvas/canvas-node/{name}-preview.tsx`
Превью узла на холсте — отображает ключевые данные ноды.

### Новый файл: `client/components/editor/canvas/canvas-node/{name}-header.tsx`
Заголовок узла на холсте (опционально, если нужен кастомный заголовок).

### `client/components/editor/canvas/canvas-node/canvas-node.tsx`
Четыре места:
1. **Импорт** нового компонента превью
2. **Порт `trigger-next`** — добавить тип в условие `|| (node.type as any) === 'managed_bot_updated_trigger'`
3. **Компактный размер `w-52`** — добавить тип в условие
4. **Скрытие `NodeHeader`** — добавить `&& (node.type as any) !== 'managed_bot_updated_trigger'`
5. **Рендер превью** — добавить блок `{(node.type as any) === '...' && <Preview />}`
6. **Скрытие футера с айди** — добавить тип в условие скрытия `#{node.id}`

### `client/components/editor/canvas/canvas-node/node-header.tsx`
Добавить `case` в `switch` для рендера заголовка.

### `client/components/editor/canvas/canvas-node/node-icons.ts`
Добавить иконку: `managed_bot_updated_trigger: 'fas fa-robot'`

### `client/components/editor/canvas/canvas-node/node-colors.ts`
Добавить цветовую схему для нового типа.

### `client/components/editor/canvas/canvas-node/connections-layer.tsx`
Два места:
1. `isTrigger` в функции `buildSmartPath` — добавить тип
2. `collectConnections` пункт 4 — добавить тип для генерации `trigger-next` соединения

---

## 5. Переменные

### `client/components/editor/inline-rich/components/variable-display-utils.tsx`
Два места:
1. `getBadgeText` — добавить бейдж для нового типа
2. `getNodeInfo` — добавить case для отображения описания переменной

---

## 6. Раскладка (layout)

### `client/utils/hierarchical-layout.ts`
Два места:
1. `ROOT_TYPES` — добавить тип чтобы триггер позиционировался как корневой узел
2. `inferConnectionsFromNodes` — добавить тип в условие для `trigger-next`

---

## Итого файлов

| Тип | Количество |
|-----|-----------|
| Новых файлов | 3–4 |
| Редактируемых файлов | 14–15 |

---

## Порядок реализации

1. Схема (`node-schema.ts`)
2. Определение триггера (`sidebar/massive/triggers/`)
3. Регистрация в сайдбаре (`index.ts`, `constants.ts`)
4. Панель свойств (`Configuration.tsx`, `properties-panel.tsx`, `properties-header.tsx`, `node-constants.ts`, `node-defaults.ts`, `node-formatters.ts`)
5. Канвас (`preview.tsx`, `header.tsx`, `canvas-node.tsx`, `node-header.tsx`, `node-icons.ts`, `node-colors.ts`, `connections-layer.tsx`)
6. Переменные (`variables-utils.ts`, `variable-display-utils.tsx`)
7. Раскладка (`hierarchical-layout.ts`)

---

# Добавление нового триггера в генерацию кода

Этот раздел описывает все файлы для добавления поддержки нового триггера на стороне генерации Python кода.

Пример реализации: `managed_bot_updated_trigger` → папка `lib/templates/managed-bot-updated-trigger/`.

---

## 1. Новая папка шаблона `lib/templates/{name}/`

Каждый триггер — отдельная папка со стандартным набором файлов:

### `{name}.params.ts` — TypeScript интерфейсы
Определяет `{Name}Entry` (поля одного триггера) и `{Name}TemplateParams` (массив entries).

Обязательные поля Entry:
- `nodeId: string` — ID узла
- `targetNodeId: string` — ID целевого узла
- `targetNodeType: string` — тип целевого узла

Опциональные поля — специфичные для триггера (переменные для сохранения, фильтры и т.д.).

### `{name}.schema.ts` — Zod схема валидации
Валидирует параметры перед передачей в шаблон. Обязательные поля — `z.string()`, опциональные — `z.string().optional()`.

### `{name}.py.jinja2` — Jinja2 шаблон Python кода
Генерирует Python обработчик. Для триггеров-сообщений:
```jinja2
@dp.message(lambda m: m.{event_field} is not None)
async def {name}_{nodeId}_handler(message: types.Message):
    ...
    fake_cb = FakeCallbackQuery(user_id, message)
    await handle_callback_{targetNodeId}(fake_cb)
```

`FakeCallbackQuery` должен содержать `self.message = message` чтобы `safe_edit_or_send` мог отправить ответ.

### `{name}.renderer.ts` — функции генерации
Три функции:
- `collect{Name}Entries(nodes)` — собирает триггеры из узлов
- `generate{Name}(params)` — низкоуровневый API
- `generate{Name}Handlers(nodes)` — высокоуровневый API

### `{name}.fixture.ts` — тестовые данные
Фикстуры для unit-тестов: `validParamsEmpty`, `validParamsSingle`, `validParamsMultiple`, `nodesWithTrigger`, `nodesWithMissingTarget`, `nodesWithoutTriggers`, `nodesWithNullAndMixed`.

### `{name}.test.ts` — unit тесты (vitest)
Блоки тестов:
- `generate{Name}()` — 8–10 тестов
- `{name}ParamsSchema` — 4 теста
- `collect{Name}Entries()` — 5 тестов
- `generate{Name}Handlers()` — 4 теста
- Специфика триггера — 5–7 тестов
- Производительность — 2 теста

### `{name}.md` — документация
Описание, таблица параметров, пример входных данных, пример выходного Python кода, использование API.

### `index.ts` — реэкспорт модуля

---

## 2. Фазовый тест `lib/tests/test-phase-{name}.ts`

Интеграционный тест генерации Python кода через `generatePythonCode`. Блоки:
- **A**: Базовая генерация (10 тестов) — декоратор, имя, переменные, вызов handle_callback, logging, без autoTransitionTo, несколько триггеров, синтаксис
- **B**: Целевые ноды (6 тестов) — message, forward_message, condition, с переменными
- **C**: Специфика триггера (4 теста) — фильтры, условия
- **D**: Взаимодействие с другими триггерами (5 тестов)
- **E**: FakeCallbackQuery (4 теста) — from_user, _is_fake, self.message
- **F**: Полные сценарии (3 теста) — с userDatabaseEnabled, несколько триггеров

---

## 3. Редактируемые файлы

### `lib/templates/node-handlers/node-handlers.dispatcher.ts`
Три изменения:
1. Добавить импорт `generate{Name}Handlers`
2. Добавить блок вызова после аналогичных триггеров:
```ts
const {name}Code = generate{Name}Handlers(nodes);
if ({name}Code) {
  codeLines.push('\n# Обработчики {название}');
  {name}Code.split('\n').forEach(line => codeLines.push(line));
}
```
3. Добавить тип в условие пропуска: `|| (node.type as any) === '{type_name}'`

### `lib/templates/filters/node-predicates.ts`
Добавить предикат:
```ts
export function has{Name}Nodes(nodes: Node[]): boolean {
  return nodes.filter(n => n != null).some(node => (node.type as string) === '{type_name}');
}
```

---

## 4. Особенности для разных типов триггеров

### Триггер-сообщение (ContentType)
Регистрируется через `@dp.message(lambda m: m.{field} is not None)`.
`FakeCallbackQuery` принимает `message` и хранит `self.message = message`.

### Триггер-апдейт (Update.*)
Регистрируется через `@dp.update.outer_middleware()`.
`FakeCallbackQuery` без `self.message`.

### Триггер-команда
Регистрируется через `@dp.message(Command("..."))`.

---

## 5. Итого файлов для генерации

| Тип | Количество |
|-----|-----------|
| Новых файлов в папке шаблона | 8 |
| Новый фазовый тест | 1 |
| Редактируемых файлов | 2 |
| **Итого** | **11** |

---

## 6. Порядок реализации (генерация)

1. `{name}.params.ts` — интерфейсы
2. `{name}.schema.ts` — схема
3. `{name}.py.jinja2` — шаблон
4. `{name}.renderer.ts` — генератор
5. `{name}.fixture.ts` — фикстуры
6. `{name}.test.ts` — unit тесты
7. `{name}.md` — документация
8. `index.ts` — реэкспорт
9. `node-handlers.dispatcher.ts` — интеграция
10. `node-predicates.ts` — предикат
11. `test-phase-{name}.ts` — фазовый тест
