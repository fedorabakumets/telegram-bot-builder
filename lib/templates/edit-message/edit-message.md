# edit_message — серверный рендерер

Модуль генерирует Python-код для узла `edit_message`, который редактирует уже отправленное сообщение через `bot.edit_message_text()` / `bot.edit_message_reply_markup()`.

## Структура модуля

| Файл | Назначение |
|------|-----------|
| `edit-message.params.ts` | TypeScript интерфейсы `EditMessageEntry` и `EditMessageTemplateParams` |
| `edit-message.schema.ts` | Zod схема `editMessageParamsSchema` для валидации |
| `edit-message.renderer.ts` | Функции `collectEditMessageEntries`, `generateEditMessage`, `generateEditMessageHandlers` |
| `edit-message.py.jinja2` | Jinja2 шаблон генерации Python-кода |
| `edit-message.fixture.ts` | Тестовые фикстуры |
| `edit-message.test.ts` | Vitest тесты |
| `index.ts` | Реэкспорт модуля |

## Поля узла

| Поле | Тип | Описание |
|------|-----|---------|
| `editMode` | `'text' \| 'markup' \| 'both'` | Что редактировать |
| `editMessageText` | `string` | Новый текст (поддерживает `{var}`) |
| `editFormatMode` | `'html' \| 'markdown' \| 'none'` | Режим форматирования |
| `editMessageIdSource` | `'last_bot_message' \| 'custom'` | Источник ID сообщения |
| `editMessageIdManual` | `string` | ID или `{переменная}` |
| `editKeyboardMode` | `'keep' \| 'remove' \| 'node'` | Режим клавиатуры |
| `editKeyboardNodeId` | `string` | ID keyboard-узла |
| `autoTransitionTo` | `string` | ID следующего узла |

## Особенности

- Узел **не пропускается** при отсутствии `autoTransitionTo` — может быть конечным.
- Регистрируется как `@dp.callback_query(lambda c: c.data == "<nodeId>")`.
- При `editKeyboardMode === 'node'` передаётся `reply_markup=None` как заглушка.

## Использование

```ts
import { generateEditMessageHandlers } from '../edit-message';

const code = generateEditMessageHandlers(nodes);
```
