# Миграция collectUserInput → отдельная нода input

## Проблема

Message-ноды исторически поддерживают `collectUserInput: true` с полями `inputVariable`, `enableTextInput/Photo/Video/Audio/Document` и т.д. Это дублирует функционал отдельной ноды `input` и усложняет архитектуру.

Решение: `input`-нода — единственный способ сбора ввода. `collectUserInput` в message — deprecated и запрещён для новых проектов.

## Что мигрировать

Для каждой message-ноды с `collectUserInput: true`:

### Поля для переноса в input-ноду:
- `inputVariable` → `inputVariable`
- `enableTextInput` → определяет `inputType`
- `enablePhotoInput` → `inputType: "photo"`
- `enableVideoInput` → `inputType: "video"`
- `enableAudioInput` → `inputType: "audio"`
- `enableDocumentInput` → `inputType: "document"`
- `photoInputVariable`, `videoInputVariable`, `audioInputVariable`, `documentInputVariable`
- `validationType`, `minLength`, `maxLength`
- `retryMessage`, `successMessage`
- `appendVariable`
- `saveToDatabase`

### Поля для очистки в message-ноде:
- `collectUserInput` → `false`
- Удалить: `inputVariable`, все `enable*Input`, все `*InputVariable`, `validationType`, `minLength`, `maxLength`, `retryMessage`, `successMessage`, `appendVariable`, `saveToDatabase` (в контексте ввода)
- `autoTransitionTo` → ID новой input-ноды (если создаётся)

## Логика миграции

```
1. Найти message-ноду с collectUserInput: true
2. Проверить autoTransitionTo:
   a. Если ведёт к существующей input-ноде → просто очистить message
   b. Если ведёт к другой ноде или пусто → создать input-ноду
3. При создании input-ноды:
   - ID: "input-migrated-{nanoid}"
   - position: { x: message.position.x + 420, y: message.position.y }
   - inputTargetNodeId: старый autoTransitionTo message-ноды
   - Перенести все input-поля
4. Обновить message-ноду:
   - autoTransitionTo → ID новой input-ноды
   - enableAutoTransition: true
   - Удалить все input-поля
   - collectUserInput: false
```

## Где реализовать

### Файл: `server/utils/migrateCollectUserInput.ts`

```ts
export function migrateCollectUserInput(nodes: any[]): any[] {
  // ... логика миграции
  // Возвращает обновлённый массив nodes (с новыми input-нодами если нужно)
}
```

### Вызов: `server/utils/normalizeProjectData.ts`

```ts
import { migrateCollectUserInput } from "./migrateCollectUserInput";

export function normalizeProjectData(projectData: any) {
  if (!projectData?.data?.sheets) return projectData;

  const normalizedSheets = projectData.data.sheets.map((sheet: any) => ({
    ...sheet,
    nodes: migrateCollectUserInput(
      sheet.nodes ? sheet.nodes.map(normalizeNodeData) : []
    )
  }));

  return { ...projectData, data: { ...projectData.data, sheets: normalizedSheets } };
}
```

## Проверка: есть ли парная input-нода

```ts
function hasExistingInputNode(nodes: any[], targetId: string): boolean {
  return nodes.some(n => n.id === targetId && n.type === 'input');
}
```

Если `autoTransitionTo` ведёт к input-ноде — миграция не создаёт новую, только чистит message.

## Этапы внедрения

1. ✅ Документация обновлена (bot-json-prompt.md, NODE_TYPES.md)
2. ⬜ Реализовать `migrateCollectUserInput.ts`
3. ⬜ Подключить в `normalizeProjectData.ts`
4. ⬜ Убрать UI сбора ввода из панели свойств message-ноды
5. ⬜ Убрать генерацию `waiting_for_input` из message-шаблона (lib)
6. ⬜ Убрать `collectUserInput` из shared schema (breaking change, последний этап)

## Риски

- Старые проекты в продакшене: генерация уже произошла, Python-код работает. Проблема только при перегенерации после этапа 5.
- Позиционирование: при создании input-ноды нужно правильно расположить на канвасе (x + 420).
- AI-генерация: промт обновлён, агенты не будут создавать collectUserInput.

## Приоритет

Средний. Новые проекты уже создаются без collectUserInput (промт обновлён). Миграция нужна для чистоты старых проектов.
