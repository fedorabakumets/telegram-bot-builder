# Format Module

Модуль утилит для форматирования и обработки данных.

## Файлы

- `calculateOptimalColumns.ts` - Расчет оптимального количества колонок для кнопок
- `createSafeFunctionName.ts` - Создание безопасных имен функций
- `escapeForJsonString.ts` - Экранирование строк для JSON
- `escapeForPython.ts` - Экранирование строк для Python
- `extractNodesAndConnections.ts` - Извлечение узлов и связей из данных бота
- `formatTextForPython.ts` - Форматирование текста для Python кода
- `generateAttachedMediaSendCode.ts` - Генерация кода отправки медиафайлов
- `generateButtonText.ts` - Генерация текста для кнопок
- `generateUniqueShortId.ts` - Генерация уникальных коротких идентификаторов
- `generateWaitingStateCode.ts` - Генерация кода состояний ожидания
- `getParseMode.ts` - Определение режима парсинга сообщений
- `parsePythonCodeToJson.ts` - Парсинг Python кода в JSON
- `stripHtmlTags.ts` - Удаление HTML тегов из текста
- `toPythonBoolean.ts` - Конвертация значений в Python boolean

## Использование

```typescript
import { 
  formatTextForPython, 
  stripHtmlTags, 
  generateUniqueShortId,
  extractNodesAndConnections 
} from './format';

// Форматирование текста для Python
const pythonText = formatTextForPython(rawText);

// Извлечение данных из схемы бота
const { nodes, connections } = extractNodesAndConnections(botData);
```

## Особенности

- Безопасное экранирование для различных форматов
- Оптимизация отображения элементов интерфейса
- Конвертация между различными форматами данных
- Утилиты для работы с медиафайлами