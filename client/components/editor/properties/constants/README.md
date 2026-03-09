# Константы (Constants)

**Модуль:** `components/editor/properties/constants`

## 📁 Структура

```
constants/
├── keyboard.types.ts         # Типы и константы клавиатур
├── conditional.constants.ts  # Константы условий
└── index.ts                  # Баррел-экспорт
```

## 📦 Использование

### Константы клавиатур

```typescript
import { KEYBOARD_TYPES, BUTTON_TYPES, BUTTON_ACTIONS } from 'components/editor/properties/constants';

// Вместо строковых литералов
const keyboardType = KEYBOARD_TYPES.INLINE;  // 'inline'
const buttonType = BUTTON_TYPES.NORMAL;      // 'normal'
const buttonAction = BUTTON_ACTIONS.GOTO;    // 'goto'
```

### Константы условий

```typescript
import {
  CONDITION_PRIORITIES,
  USER_STATUS_CONDITIONS,
  DATA_EXISTS_CONDITIONS,
  DATA_MATCH_CONDITIONS,
  getConditionPriority
} from 'components/editor/properties/constants';

// Получение приоритета
const priority = getConditionPriority('first_time');  // 100

// Проверка типа условия
if (USER_STATUS_CONDITIONS.includes(condition)) {
  // Это условие статуса пользователя
}
```

## 📝 API

### KeyboardType

Тип клавиатуры.

```typescript
type KeyboardType = 'inline' | 'reply' | 'none';
```

### KEYBOARD_TYPES

Объект с константами типов клавиатур.

```typescript
const KEYBOARD_TYPES = {
  INLINE: 'inline',   // Кнопки под сообщением
  REPLY: 'reply',     // Кнопки в поле ввода
  NONE: 'none'        // Без клавиатуры
} as const;
```

### BUTTON_TYPES

Объект с константами типов кнопок.

```typescript
const BUTTON_TYPES = {
  NORMAL: 'normal',     // Обычная кнопка
  OPTION: 'option',     // Кнопка опции
  CONTINUE: 'continue'  // Кнопка продолжения
} as const;
```

### BUTTON_ACTIONS

Объект с константами действий кнопок.

```typescript
const BUTTON_ACTIONS = {
  GOTO: 'goto',      // Переход к узлу
  COMMAND: 'command', // Выполнение команды
  URL: 'url'          // Открытие URL
} as const;
```

### CONDITION_PRIORITIES

Приоритеты для типов условий.

```typescript
const CONDITION_PRIORITIES = {
  USER_STATUS: 100,    // first_time, returning_user
  DATA_EXISTS: 50,     // user_data_exists, user_data_not_exists
  DATA_MATCH: 30,      // user_data_equals, user_data_contains
  DEFAULT: 10          // остальные условия
} as const;
```

### getConditionPriority

Функция получения приоритета для типа условия.

```typescript
function getConditionPriority(condition: string): number;

// Пример
getConditionPriority('first_time');        // 100
getConditionPriority('user_data_exists');  // 50
getConditionPriority('custom');            // 10
```

## 🎯 Принципы

1. **Использовать `as const`** — для строгих типов
2. **Экспортировать типы** — для использования в компонентах
3. **Группировать по теме** — одна папка — одна тема
4. **JSDoc комментарии** — для всех констант
5. **Избегать магических значений** — выносить в константы
