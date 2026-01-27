# Media Handler Module

Модуль для генерации обработчиков различных типов медиафайлов.

## Файлы

- `generateAnimationHandler.ts` - Обработчик анимаций (GIF)
- `generateContactHandler.ts` - Обработчик контактов
- `generateLocationHandler.ts` - Обработчик геолокации
- `generateStickerHandler.ts` - Обработчик стикеров
- `generateVoiceHandler.ts` - Обработчик голосовых сообщений

## Использование

```typescript
import { 
  generateAnimationHandler,
  generateContactHandler,
  generateLocationHandler,
  generateStickerHandler,
  generateVoiceHandler 
} from './MediaHandler';

// Генерация обработчика стикеров
const stickerHandler = generateStickerHandler(nodes, connections);

// Генерация обработчика геолокации
const locationHandler = generateLocationHandler(nodes, locationNodes);
```

## Поддерживаемые типы медиа

### Визуальные медиа
- **Анимации (GIF)** - обработка анимированных изображений
- **Стикеры** - обработка стикеров и стикерпаков

### Аудио медиа
- **Голосовые сообщения** - обработка voice и audio файлов

### Данные
- **Контакты** - обработка переданных контактов
- **Геолокация** - обработка координат местоположения

## Особенности

- Автоматическое сохранение медиафайлов
- Интеграция с системой переменных
- Поддержка условной обработки
- Генерация соответствующих Python обработчиков для aiogram