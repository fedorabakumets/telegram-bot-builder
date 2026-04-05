# Шаблон keyboard.py.jinja2

## Описание

Шаблон генерирует Python-код клавиатуры Telegram-бота. В новой canvas-модели keyboard-нода может быть отдельным узлом, но для генератора она всё равно трактуется как клавиатура, прикреплённая к ближайшему message/start/command-контексту.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `keyboardType` | `'inline' \| 'reply' \| 'none'` | Да | `'none'` | Тип клавиатуры |
| `buttons` | `Button[]` | Да | `[]` | Массив кнопок |
| `keyboardLayout` | `KeyboardLayout` | Нет | `undefined` | Раскладка клавиатуры |
| `oneTimeKeyboard` | `boolean` | Да | `false` | Скрыть клавиатуру после использования |
| `resizeKeyboard` | `boolean` | Да | `true` | Изменить размер под кнопки |
| `allowMultipleSelection` | `boolean` | Нет | `false` | Включает множественный выбор |
| `multiSelectVariable` | `string` | Нет | `multi_select_<nodeId>` | Имя переменной для сохранения выбранных значений |

## Структура Button

```typescript
interface Button {
  id: string;
  text: string;
  action: string;
  target?: string;
  url?: string;
  requestContact?: boolean;       // Запросить контакт (только для contact, reply)
  requestLocation?: boolean;      // Запросить геолокацию (только для location, reply)
  suggestedBotName?: string;      // Предложенное имя бота (только для request_managed_bot, Bot API 9.6)
  suggestedBotUsername?: string;  // Предложенный username бота (только для request_managed_bot, Bot API 9.6)
  customCallbackData?: string;    // Переопределяет авто-генерируемый callback_data (только для goto/command)
}
```

## Структура KeyboardLayout

```typescript
interface KeyboardLayout {
  rows: Array<{ buttonIds: string[] }>;
  columns: number;
  autoLayout: boolean;
}
```

## Примеры

```typescript
import { generateKeyboard } from './keyboard.renderer';

const code = generateKeyboard({
  keyboardType: 'inline',
  buttons: [
    { text: 'Статистика', action: 'callback', target: 'stats', id: 'btn_stats' },
    { text: 'Настройки', action: 'callback', target: 'settings', id: 'btn_settings' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
});
```

## Примечание

Если keyboard-нода вынесена отдельно на canvas, её данные при генерации переносятся в связанный message/start/command-узел. Привязка может быть явной через `keyboardNodeId` или неявной через граф переходов, например `message -> condition -> keyboard`. Сам `keyboard`-узел остаётся отдельной сущностью только на уровне редактора.

## Переменные {callback_data} и {button_text}

При нажатии инлайн-кнопки в обработчике `handle_callback_<nodeId>` автоматически сохраняются переменные:

| Переменная | Значение |
|------------|----------|
| `{callback_data}` | Значение `callback_data` нажатой кнопки |
| `{button_text}` | Текст нажатой кнопки (ищется по `callback_data` среди кнопок узла) |

Эти переменные доступны в тексте следующего сообщения через `replace_variables_in_text`.

**Какие action имеют callback_data:**
- `goto` → `customCallbackData` или `target` (nodeId)
- `command` → `customCallbackData` или `cmd_<target>`
- `selection` → `ms_<shortNodeId>_<shortButtonId>`
- `complete` → `done_<shortNodeId>` или `customCallbackData` или `target`
- `default` → `customCallbackData` или `target` или `id`

**Не имеют callback_data:** `url`, `web_app` (с url), `contact`, `location`, `copy_text` (с copyText), `request_managed_bot`
