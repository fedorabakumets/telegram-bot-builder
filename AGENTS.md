---
inclusion: always
---

# Правила JSDoc комментариев

Все новые файлы и все вносимые изменения в существующие файлы **обязаны** содержать JSDoc комментарии на **русском языке**.

## Общие требования

- Стремиться к **100 строкам** на один файл за одну итерацию, максимум **150 строк**. Это относится только к файлам `server/` и `client/`, но **не к `lib/`** и **не к `tools/`**.
- Если изменений больше — рефакторинг выносится в отдельный файл.
- Чем больше новых файлов, доступных для переиспользования, тем лучше.
- Чем меньше кода в каждом файле, тем лучше.

## Обязательные требования JSDoc

### @fileoverview

Каждый файл должен начинаться с блока `@fileoverview`:

```ts
/**
 * @fileoverview Краткое описание назначения файла
 * @module путь/к/модулю (опционально)
 */
```

### Типы и интерфейсы

Каждое поле типа/интерфейса комментируется в формате однострочного JSDoc:

```ts
export interface Example {
  /** Тип медиа: "photo", "video", "audio", "document", "sticker" */
  type: string;
  /** Уникальный идентификатор элемента */
  id: number;
}
```

### Функции и методы

```ts
/**
 * Краткое описание что делает функция
 * @param param1 - Описание параметра
 * @returns Описание возвращаемого значения
 */
function example(param1: string): number { ... }
```

### Компоненты React

```ts
/**
 * Описание компонента
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MyComponent({ ... }: MyProps) { ... }
```

## Язык

Все комментарии — **только на русском языке**.

## Проверки

Никогда не выполнять полную проверку через `npm run check`.
Никогда не вызывать `npx tsc --noEmit` или любую другую полную проверку типов всего проекта.
Использовать только `getDiagnostics` для конкретных изменённых файлов.

## Правила изменения шаблонов и нод

### Обновление существующего шаблона в `lib/templates/`

1. Внести изменения в шаблон (`.py.jinja2`, `.params.ts`, `.renderer.ts`)
2. Обновить фазовый тест в `lib/tests/test-phase*-{name}.ts` — добавить тесты на новую функциональность
3. Запустить фазовый тест и убедиться что проходит
4. Обновить промт для ИИ `docs/bot-json-prompt.md` — добавить описание новых возможностей
5. Обновить документацию для людей `docs/features/NODE_TYPES.md` — описание настроек и ограничений

### Существенное расширение существующей ноды (новый mode, новые поля в UI)

Если добавляется новый mode, новый тип поведения или новые поля которые должны быть доступны пользователю в интерфейсе — это считается **существенным обновлением** и требует обновления фронтенда:

1. **Фронтенд первее lib** — сначала UI (сайдбар, панель свойств, dropdown mode), потом генерация кода
2. Внести изменения в шаблон (`.py.jinja2`, `.params.ts`, `.renderer.ts`, `.schema.ts`)
3. Обновить/создать фазовый тест в `lib/tests/`
4. Протестировать фазу
5. Обновить промт `docs/bot-json-prompt.md`
6. Обновить документацию `docs/features/NODE_TYPES.md`

### Создание новой ноды

1. **ОБЯЗАТЕЛЬНО** прочитать `docs/development/adding-new-trigger.md` **ПЕРЕД началом работы** — там полный чеклист всех файлов которые нужно обновить
2. **Фронтенд первее lib** — сначала UI (сайдбар, панель свойств, канвас), потом генерация кода
3. После обновления lib — обновить/создать фазовый тест в `lib/tests/`
4. Протестировать фазу
5. Обновить промт `docs/bot-json-prompt.md`
6. Обновить документацию `docs/features/NODE_TYPES.md`

> ⚠️ **Частая ошибка:** агенты пропускают файлы из чеклиста в `adding-new-trigger.md` и потом приходится доделывать. Не полагайся на поиск по коду — следуй инструкции пошагово. Ключевые файлы которые легко забыть:
> - `shared/schema/tables/node-schema.ts` — типы полей data
> - `lib/templates/filters/node-predicates.ts` — предикат `has*Nodes`
> - `lib/templates/keyboard-handlers/interactive-callback-handlers/interactive-callback-handlers.renderer.ts` — `NODE_TYPES_WITH_DEDICATED_HANDLERS`
> - `lib/templates/node-handlers/node-handlers.dispatcher.ts` — подключение генератора в пайплайн
> - `lib/index.ts` — экспорт для внешнего использования

## Правила редактирования project.json (ноды ботов)

### Condition-нода (type: "condition")

**НИКОГДА** не использовать формат `conditions` + `defaultTarget`. Это несуществующий формат.

Правильный формат condition-ноды:

```json
{
  "id": "my-condition-node",
  "type": "condition",
  "position": {"x": 0, "y": 0},
  "data": {
    "buttons": [],
    "variable": "имя_переменной_для_проверки",
    "branches": [
      {
        "id": "branch_1",
        "value": "",
        "target": "id-целевой-ноды-если-условие-true",
        "operator": "filled"
      },
      {
        "id": "branch_else",
        "value": "",
        "target": "id-целевой-ноды-по-умолчанию",
        "operator": "else"
      }
    ],
    "markdown": false,
    "adminOnly": false,
    "showInMenu": false,
    "messageText": "",
    "keyboardType": "none",
    "requiresAuth": false,
    "isPrivateOnly": false,
    "resizeKeyboard": true,
    "oneTimeKeyboard": false,
    "enableStatistics": false
  }
}
```

**Допустимые операторы:** `filled`, `empty`, `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `matches_regex`, `greater_than`, `less_than`, `between`, `is_even`, `is_odd`, `divisible_by`, `else`, `is_private`, `is_group`, `is_channel`, `is_admin`, `is_premium`, `is_bot`, `is_subscribed`, `is_not_subscribed`.

**НЕ существуют операторы:** `not_empty`, `is_empty`, `is_not_empty` и любые другие не из списка выше.

### Перед созданием/изменением нод

Всегда сверяться с существующими нодами того же типа в project.json — копировать формат `data` из рабочих нод, а не выдумывать свой.

