# Панель свойств (Properties)

**Модуль:** `components/editor/properties`

## 📁 Структура папки

```
properties/
├── components/           # React компоненты панели свойств
│   ├── layout/          # Компоненты макета
│   ├── common/          # Общие компоненты
│   ├── keyboard/        # Компоненты клавиатур
│   ├── conditional/     # Условные сообщения
│   ├── variables/       # Переменные
│   ├── questions/       # Вопросы
│   ├── commands/        # Команды
│   ├── broadcast/       # Рассылки
│   ├── admin/           # Администрирование
│   ├── navigation/      # Навигация
│   ├── csv/             # CSV экспорт
│   ├── synonyms/        # Синонимы
│   └── main/            # Главные компоненты
│
├── action-loggers/       # Логгеры действий
├── configuration/        # Конфигурации типов узлов
├── hooks/               # React хуки
├── media/               # Утилиты медиа
├── utils/               # Вспомогательные утилиты
└── index.ts             # Главный баррель-экспорт
```

## 📦 Использование

### Импорт компонентов

```typescript
// Импорт из конкретного модуля
import { PropertiesPanel } from 'components/editor/properties/components/main';
import { ConditionalButton } from 'components/editor/properties/components/conditional';
import { KeyboardTypeSelector } from 'components/editor/properties/components/keyboard';

// Импорт из главного барреля
import { 
  PropertiesPanel,
  ConditionalButton,
  KeyboardTypeSelector
} from 'components/editor/properties';
```

### Импорт утилит

```typescript
// Импорт утилит
import { updateConditionalMessage } from 'components/editor/properties/utils/conditional-utils';
import { formatNodeDisplay } from 'components/editor/properties/utils/node-formatters';

// Импорт хуков
import { useMedia } from 'components/editor/properties/hooks/use-media';
import { useMediaVariables } from 'components/editor/properties/hooks/use-media-variables';
```

## 🎯 Архитектурные принципы

### 1. Разделение по ответственности
Каждая папка содержит компоненты с единой зоной ответственности:
- `layout/` — только макет
- `conditional/` — только условные сообщения
- `keyboard/` — только клавиатуры

### 2. Переиспользование
Компоненты должны быть максимально переиспользуемыми:
- Минимум зависимостей
- Чёткие интерфейсы пропсов
- Изолированная логика

### 3. Типизация
Все компоненты и утилиты строго типизированы:
- Никаких `any`
- Интерфейсы для всех пропсов
- Generics где возможно

### 4. Документация
Каждый файл содержит JSDoc:
```typescript
/**
 * @fileoverview Описание файла
 * @module Путь к модулю
 */
```

## 📝 Создание нового компонента

### Шаг 1: Определить папку
Выберите существующую папку или создайте новую:
```bash
mkdir components/editor/properties/components/new-category
```

### Шаг 2: Создать файл компонента
```typescript
/**
 * @fileoverview Описание компонента
 * @module components/editor/properties/components/new-category
 */

import React from 'react';

/**
 * Пропсы компонента
 */
export interface NewComponentProps {
  /** Значение prop */
  value: string;
  /** Callback изменения */
  onChange: (value: string) => void;
}

/**
 * Описание компонента
 * @param props Пропсы компонента
 * @returns JSX элемент
 */
export function NewComponent({ value, onChange }: NewComponentProps) {
  return <div>{value}</div>;
}
```

### Шаг 3: Добавить в index.ts
```typescript
// components/new-category/index.ts
export * from './new-component';
```

## 🔧 Рефакторинг

### Перемещение компонента в папку

**Было:**
```typescript
// properties/old-component.tsx
import { Helper } from './helper';
```

**Стало:**
```typescript
// properties/components/category/old-component.tsx
import { Helper } from '../helper';
// или
import { Helper } from 'components/editor/properties/utils/helper';
```

### Обновление импортов во внешних файлах

**Было:**
```typescript
import { PropertiesPanel } from './properties/properties-panel';
```

**Стало:**
```typescript
import { PropertiesPanel } from './properties/components/main';
// или
import { PropertiesPanel } from './properties';
```

## 📊 Метрики

| Метрика | Значение |
|---------|----------|
| Всего папок | 18 |
| Компонентов | ~50 |
| Утилит | ~7 |
| Хуков | ~3 |
| Конфигураций | ~13 |
| Логгеров | ~11 |

## 🤝 Контрибьюторам

### Перед коммитом проверьте:
1. [ ] JSDoc комментарии на русском
2. [ ] Экспорт в соответствующем `index.ts`
3. [ ] Строгая типизация (без `any`)
4. [ ] Компонент в правильной папке
5. [ ] Относительные импорты корректны

### Запрещено:
- ❌ Использование `any`
- ❌ Файлы > 500 строк
- ❌ Компоненты > 300 строк
- ❌ Глубокая вложенность (>3 уровней)
- ❌ Хардкод значений (выносить в константы)

## 📚 Дополнительная документация

- [Компоненты](./components/README.md) — детальное описание компонентов
- [Хуки](./hooks/README.md) — описание React хуков
- [Утилиты](./utils/README.md) — вспомогательные функции
