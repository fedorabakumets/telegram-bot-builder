# handle-user-input

Runtime-обработка пользовательского ввода в `handle_user_input`.

## Что генерирует

Python-блок внутри `handle_user_input`, который:

1. Проверяет наличие `waiting_for_input` в `user_data[user_id]`
2. Извлекает поля из `waiting_config` (dict): `node_id`, `type`, `variable`, `min_length`, `max_length`, `next_node_id`, `appendVariable`
3. Игнорирует текстовый ввод если ожидается медиа (`photo/video/audio/document`)
4. Валидирует длину текста (min/max)
5. Валидирует тип ввода (`email` / `phone` / `number`)
6. Очищает `waiting_for_input` после успешной обработки

## Параметры

| Параметр     | Тип    | По умолчанию | Описание                  |
|--------------|--------|--------------|---------------------------|
| `indentLevel`| string | `'    '`     | Базовый отступ для кода   |

## Использование

```typescript
import { generateHandleUserInput } from 'lib/templates/handle-user-input';

const code = generateHandleUserInput({ indentLevel: '    ' });
```

## Связанные файлы (до миграции)

- `generate-waiting-state-check.ts` — проверка `waiting_for_input`
- `generate-waiting-config-extract.ts` — извлечение полей из `waiting_config`
- `generate-waiting-cleanup.ts` — `del user_data[user_id]["waiting_for_input"]`
- `generate-input-type-validation.ts` — валидация email/phone/number
- `generate-text-length-validation.ts` — валидация min/max длины
`call_skip_target_handler` генерируется внутри шаблона и не зависит от внешнего глобального helper.
