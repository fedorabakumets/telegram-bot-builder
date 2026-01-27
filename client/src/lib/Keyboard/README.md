# Keyboard Module

Модуль для генерации различных типов клавиатур Telegram.

## Файлы

- `generateInlineKeyboardCode.ts` - Генерация inline клавиатур
- `generateKeyboard.ts` - Общие утилиты для клавиатур
- `generateReplyKeyboardCode.ts` - Генерация reply клавиатур

## Использование

```typescript
import { 
  generateInlineKeyboardCode, 
  generateReplyKeyboardCode,
  generateKeyboard 
} from './Keyboard';

// Генерация inline клавиатуры
const inlineKeyboard = generateInlineKeyboardCode(buttons, nodeId);

// Генерация reply клавиатуры
const replyKeyboard = generateReplyKeyboardCode(buttons, options);
```

## Типы клавиатур

### Inline клавиатуры
- Кнопки с callback_data
- URL кнопки
- Кнопки переключения (switch_inline_query)

### Reply клавиатуры
- Обычные текстовые кнопки
- Кнопки запроса контакта
- Кнопки запроса геолокации
- Настраиваемый размер и поведение

## Особенности

- Автоматический расчет оптимального расположения кнопок
- Поддержка условных кнопок
- Интеграция с системой переменных
- Генерация Python кода для aiogram