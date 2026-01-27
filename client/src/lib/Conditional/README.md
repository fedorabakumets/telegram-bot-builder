# Conditional Module

Модуль для генерации условной логики в Telegram ботах.

## Файлы

- `generateConditionalKeyboard.ts` - Генерация условных клавиатур
- `generateConditionalMessageLogic.ts` - Генерация условной логики сообщений

## Использование

```typescript
import { generateConditionalKeyboard, generateConditionalMessageLogic } from './Conditional';

// Генерация условной клавиатуры
const conditionalKeyboard = generateConditionalKeyboard(node, conditions);

// Генерация условной логики для сообщений
const messageLogic = generateConditionalMessageLogic(node, variables);
```

## Особенности

- Поддержка условий на основе переменных пользователя
- Динамическое отображение кнопок
- Условная маршрутизация между узлами
- Интеграция с системой переменных