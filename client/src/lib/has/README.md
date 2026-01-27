# Has Module

Модуль для проверки наличия различных возможностей и функций в боте.

## Файлы

- `hasAutoTransitions.ts` - Проверка наличия автоматических переходов
- `hasCommandButtons.ts` - Проверка наличия кнопок команд
- `hasConditionalButtons.ts` - Проверка наличия условных кнопок
- `hasInlineButtons.ts` - Проверка наличия inline кнопок
- `hasInputCollection.ts` - Проверка наличия сбора пользовательского ввода
- `hasLocationFeatures.ts` - Проверка наличия функций геолокации
- `hasMediaNodes.ts` - Проверка наличия медиа узлов
- `hasMultiSelectNodes.ts` - Проверка наличия узлов множественного выбора

## Использование

```typescript
import { 
  hasInlineButtons, 
  hasMediaNodes, 
  hasAutoTransitions,
  hasLocationFeatures 
} from './has';

// Проверка наличия inline кнопок
if (hasInlineButtons(nodes)) {
  // Добавить поддержку inline клавиатур
}

// Проверка наличия медиа узлов
if (hasMediaNodes(nodes)) {
  // Добавить обработчики медиафайлов
}
```

## Особенности

- Анализ структуры бота для определения необходимых функций
- Оптимизация генерируемого кода на основе используемых возможностей
- Условная генерация обработчиков и middleware
- Помощь в принятии решений о включении зависимостей