# Полный вынос кнопок из message в keyboard-ноду

## Проблема

Поля `buttons` и `keyboardType` концептуально относятся только к `keyboard`-ноде, но фактически до сих пор живут и в `message`-нодах. Архитектура переходная: одновременно поддерживаются два способа задания клавиатуры.

- **Legacy:** кнопки лежат прямо в `message.data.buttons` + `message.data.keyboardType`.
- **Новый:** отдельная `keyboard`-нода, привязанная к сообщению через `keyboardNodeId`.

Из-за этого `message`-ноды несут в JSON поля клавиатуры, даже когда визуально клавиатура вынесена в отдельную ноду.

## Что мешает просто убрать поля

1. **Генератор читает кнопки из message:**
   - `lib/templates/node-handlers/node-handlers.dispatcher.ts` → `buildMessageHandlerParams` берёт `sortButtonsByLayout(node.data?.buttons, node.data?.keyboardLayout)` и `keyboardType`.
   - `lib/bot-generator/transitions/generate-state-transition-and-render-logic.ts` проверяет `targetNode.type === 'message' && targetNode.data.keyboardType === 'inline' && targetNode.data.buttons.length > 0` и рендерит inline-клавиатуру напрямую из message-ноды.
2. **Legacy-проекты** держат кнопки в самом сообщении — выкидывание полей сломает их клавиатуры.
3. **Миграция** `client/components/editor/canvas/canvas/utils/migrate-message-keyboards.ts` уже переносит кнопки в отдельные keyboard-ноды, но только для message с непустыми `buttons`; полный отказ от legacy не сделан.

## Предлагаемый план (отдельная итерация)

1. Убедиться, что миграция `migrateMessageKeyboardsToNodes` покрывает все случаи (inline + reply + conditional buttons).
2. Перевести генератор на чтение клавиатуры **только** из привязанной `keyboard`-ноды (`keyboardNodeId`), убрав ветки чтения `buttons`/`keyboardType` из message в:
   - `node-handlers.dispatcher.ts` (`buildMessageHandlerParams`)
   - `generate-state-transition-and-render-logic.ts`
3. После этого исключить `message` из списка типов, которым подмешиваются `buttons`/`keyboardType` (хелпер `client/utils/sheets/needs-message-defaults.ts`).
4. **Обязательно** прогнать фазовые тесты `test:phase3` (keyboards) и `test:phase4` (buttons) — это зона максимального риска регрессий.
5. Обновить документацию: `docs/features/NODE_TYPES.md`, `docs/bot-json-prompt.md`.

## Связанный контекст

- Текущая чистка мусорных полей: хелпер `needsMessageDefaults` уже исключает триггеры, management-ноды, condition и comment из подмешивания служебных полей сообщения.
- Поле `enableStatistics` уже полностью удалено как мёртвое.
