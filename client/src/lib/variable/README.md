# Variable Module

Модуль для работы с переменными в Telegram ботах.

## Файлы

- `collectMediaVariables.ts` - Сбор медиа переменных из узлов
- `findMediaVariablesInText.ts` - Поиск медиа переменных в тексте
- `generateUniversalVariableReplacement.ts` - Универсальная замена переменных
- `generateVariableReplacement.ts` - Генерация кода замены переменных

## Использование

```typescript
import { 
  collectMediaVariables,
  findMediaVariablesInText,
  generateUniversalVariableReplacement,
  generateVariableReplacement 
} from './variable';

// Сбор медиа переменных
const mediaVars = collectMediaVariables(nodes);

// Поиск переменных в тексте
const foundVars = findMediaVariablesInText(messageText);

// Генерация кода замены
const replacementCode = generateVariableReplacement(variables);
```

## Типы переменных

### Пользовательские переменные
- Данные профиля пользователя
- Введенные пользователем значения
- Состояние сессии

### Медиа переменные
- Ссылки на загруженные файлы
- Метаданные медиафайлов
- Временные медиа ссылки

### Системные переменные
- Дата и время
- ID пользователя и чата
- Системная информация

## Особенности

- Типизированные переменные
- Автоматическое определение типов
- Безопасная замена в тексте
- Поддержка вложенных переменных
- Кэширование значений переменных
- Валидация существования переменных

## Применение

- Персонализация сообщений
- Динамический контент
- Сохранение состояния пользователя
- Передача данных между узлами
- Условная логика на основе переменных