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

Если keyboard-нода вынесена отдельно на canvas, её данные при генерации переносятся в связанный message/start/command-узел. Сам `keyboard`-узел остаётся отдельной сущностью только на уровне редактора.
