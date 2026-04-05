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
