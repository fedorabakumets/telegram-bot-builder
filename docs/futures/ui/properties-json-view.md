# JSON-режим панели свойств

> **Статус:** MVP реализован (этап 1). Пользовательская документация — в [`docs/interface/editor/properties.md`](../interface/editor/properties.md).

Идея: переключатель между **визуальными настройками** (текущий UI) и **raw JSON** выбранной ноды — по аналогии с n8n, где у ноды есть вкладки «Parameters» и «JSON».

Полный `project.json` по-прежнему редактируется отдельно через переключатель «Холст / JSON» на канвасе. Это разные задачи: канвасный JSON — весь проект, JSON в панели свойств — `node.data` одной выбранной ноды.

## Зачем

- Быстро править поля, для которых ещё нет UI (или они спрятаны в расширенных настройках).
- Копировать настройки ноды между проектами через буфер обмена.
- Отладка и работа с ИИ: проще вставить готовый фрагмент `data`, чем кликать по десятку полей.
- Продвинутым пользователям — привычный паттерн из n8n / Node-RED.

## UX

### Переключатель

Segmented control в заголовке панели свойств (`PropertiesHeader`), рядом с типом ноды и ID:

```
[📝 Текстовое сообщение ▼]  [node-id]     [Настройки | JSON]
```

По стилю — как существующий `CanvasViewToggle` (`client/pages/editor/components/canvas-view-toggle.tsx`).

### Поведение

| Режим | Содержимое панели |
|-------|-------------------|
| **Настройки** | Текущие секции (`BasicSettings`, `MessageContent`, клавиатура и т.д.) |
| **JSON** | Monaco-редактор с JSON объекта настроек ноды |

- Пустое состояние («Выберите элемент») — без изменений, переключатель не показывается.
- На мобильных — тот же toggle внутри `MobilePropertiesSheet`.
- Выбранный режим можно запоминать в `localStorage` (по умолчанию — «Настройки»).

### Что показывать в JSON

**v1 — только `node.data`** (настройки без `id`, `type`, `position`):

```json
{
  "messageText": "Привет!",
  "keyboardType": "inline",
  "buttons": [],
  "markdown": false
}
```

**v2 (опционально) — полная нода** `{ id, type, position, data }` для продвинутых сценариев. Риск: смена `id` ломает связи на холсте, смена `type` требует отдельной логики.

## Применение изменений

Не live-sync на каждый символ (как в n8n — apply при явном действии):

1. Кнопка **«Применить»** в футере панели (уже есть в `PropertiesFooter`).
2. Дополнительно: **Ctrl+S** в JSON-режиме.
3. При переключении **JSON → Настройки** с несохранённым draft — предупреждение «Есть несохранённые изменения».
4. Невалидный JSON — красная плашка с текстом ошибки парсинга, Apply заблокирован.

## Синхронизация Form ↔ JSON

```
Смена выбранной ноды  → сброс draft, сериализация node.data в редактор
Редактирование формы  → если JSON не dirty, обновить displayContent
Apply в JSON          → parse → replace data → форма перерисуется
```

Локальный state в `PropertiesPanel` (или хук `usePropertiesView`):

- `propertiesView: 'form' | 'json'`
- `jsonDraft: string`
- `jsonDirty: boolean`
- `jsonError: string | null`

## Техническая реализация

### Новые файлы

| Файл | Назначение |
|------|------------|
| `properties-view-toggle.tsx` | Segmented control «Настройки / JSON» |
| `node-data-json-editor.tsx` | Компактный Monaco без Card/статистики |
| `use-properties-view.ts` (опц.) | State, localStorage, сериализация |

### Изменения в существующих

| Файл | Изменение |
|------|-----------|
| `properties-panel.tsx` | Условный рендер form vs JSON |
| `properties-header.tsx` | Toggle в заголовке |
| `properties-footer.tsx` | Apply в JSON-режиме вызывает parse + replace |
| `use-node-handlers.ts` | Новый `handleNodeDataReplace` |

### Критично: replace, не merge

Сейчас `handleNodeUpdateWithSheets` **мержит** поля в `data`:

```ts
{ ...node, data: { ...node.data, ...updates } }
```

Для JSON-режима этого недостаточно: удалённый в JSON ключ останется в ноде. Нужен отдельный хендлер:

```ts
handleNodeDataReplace(nodeId: string, newData: Node['data'])
```

— полная замена объекта `data` с записью в history и action log.

### Редактор

Переиспользовать Monaco из `CodeEditorArea`, но без обёртки Card — только редактор на всю высоту scroll-области панели. Язык: `json`, тема — как в остальном редакторе.

### Валидация (этап 2)

- `JSON.parse` — обязательно на Apply.
- Мягкая проверка через Zod (`nodeSchema.shape.data`) — предупреждения, не блокировка (схема большая, не все поля обязательны для каждого типа).

## Отличие от JSON на канвасе

| | Панель свойств JSON | Канвас JSON |
|--|---------------------|-------------|
| Объект | `node.data` одной ноды | весь `project.json` |
| Когда доступен | нода выбрана, режим «JSON» в панели | переключатель «Холст / JSON» на канвасе |
| Панель свойств | видна | сейчас скрыта (`canvasView === 'json'`) |

Режимы не конфликтуют: канвасный JSON — глобальный обзор, JSON в панели — точечная правка одной ноды.

## Этапы внедрения

### Этап 1 — MVP

- [x] Toggle в `PropertiesHeader`
- [x] `NodeDataJsonEditor` — только `data`
- [x] `handleNodeDataReplace` в `use-node-handlers.ts`
- [x] Apply + отображение ошибки парсинга
- [x] Предупреждение при уходе с dirty draft

### Этап 2

- [x] Запоминание режима в `localStorage`
- [ ] Ctrl+S = Apply + сохранение в БД (сейчас Ctrl+S только обновляет состояние редактора)
- [ ] Индикатор несохранённых правок (dirty) на вкладке JSON
- [ ] Zod-предупреждения о неизвестных полях
- [ ] Кнопка «Копировать JSON» / «Вставить из буфера»

### Этап 3

- [ ] Режим «полная нода» (`id`, `type`, `position`, `data`)
- [ ] Интеграция с `handleNodeIdChange` и `handleNodeTypeChange` при смене в JSON

## Документация

- [x] `docs/interface/editor/properties.md` — описание переключателя, Apply и отличия от JSON на холсте
- [ ] Скриншот в разделе интерфейса (по необходимости)

## Связанные файлы

- `client/components/editor/properties/components/main/properties-panel.tsx`
- `client/components/editor/properties/components/layout/properties-header.tsx`
- `client/pages/editor/hooks/use-node-handlers.ts`
- `client/pages/editor/components/canvas-view-toggle.tsx` — референс UI
- `client/components/editor/code/editor/CodeEditorArea.tsx` — референс Monaco
- `docs/interface/editor/properties.md` — пользовательская документация

## Референс

n8n: у выбранной ноды в правой панели переключение между формой параметров и JSON-представлением конфигурации. Пользователь редактирует структуру напрямую, изменения применяются к той же ноде, что и UI-форма.
