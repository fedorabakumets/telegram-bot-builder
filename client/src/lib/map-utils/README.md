# Map Utils Module

Модуль для работы с картами кода и маппингом между узлами и генерируемым кодом.

## Файлы

- `generatePythonCodeWithMap.ts` - Генерация Python кода с картой соответствий
- `map-utils.ts` - Основные утилиты для работы с картами
- `parseCodeMap.ts` - Парсинг карт кода
- `removeCodeMarkers.ts` - Удаление маркеров из кода

## Использование

```typescript
import { 
  generatePythonCodeWithMap, 
  parseCodeMap,
  removeCodeMarkers 
} from './map-utils';

// Генерация кода с картой
const { code, map } = generatePythonCodeWithMap(botData);

// Парсинг карты кода
const parsedMap = parseCodeMap(mapString);

// Удаление маркеров
const cleanCode = removeCodeMarkers(codeWithMarkers);
```

## Особенности

- Отслеживание соответствия между узлами бота и генерируемым кодом
- Возможность обратного маппинга от кода к узлам
- Поддержка инкрементальных обновлений
- Отладочная информация для разработчиков

## Применение

- Синхронизация изменений между визуальным редактором и кодом
- Отладка и трассировка выполнения
- Инкрементальная регенерация кода
- IDE интеграция