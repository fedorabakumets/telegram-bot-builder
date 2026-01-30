# Промпт для рефакторинга Telegram Bot Generator

## Задача
Вынести inline Python-код из `bot-generator.ts` в отдельные модули в папке `client/src/lib/generate/`.

## Что уже сделано
Созданы модули:
- `generateLocationFunctions.ts` — функции для работы с картами (Яндекс, Google, 2ГИС)
- `generateUtilityFunctions.ts` — утилитарные функции (is_admin, is_private_chat, check_auth)
- `generateDatabaseCode.ts` — работа с БД
- `generateNodeNavigation.ts` — навигация по узлам
- И другие...

## Шаблон рефакторинга

### 1. Создать новый файл в `client/src/lib/generate/`

```typescript
/**
 * [Краткое описание функции]
 * @returns Строка с Python-кодом
 */
export function generate[ИмяФункции](): string {
  let code = '';
  
  // ... генерация кода ...
  
  return code;
}
```

### 2. Добавить экспорт в `client/src/lib/generate/index.ts`

```typescript
export { generate[ИмяФункции] } from './generate[ИмяФункции]';
```

### 3. Добавить импорт в `bot-generator.ts`

```typescript
import { ..., generate[ИмяФункции] } from './generate';
```

### 4. Заменить inline-код на вызов функции

**Было:**
```typescript
if (has[Условие](nodes || [])) {
  code += 'def some_function():\n';
  code += '    ...\n';
  // 50+ строк inline-кода
}
```

**Стало:**
```typescript
if (has[Усствие](nodes || [])) {
  code += generate[ИмяФункции]();
}
```

## Приоритет рефакторинга (по объёму inline-кода)

### Высокий приоритет (>100 строк inline)

1. **Генерация обработчиков callback-кнопок** (`handle_callback_*`)
   - Обработка множественного выбора
   - Условные клавиатуры
   - Генерация inline-клавиатур

2. **Генерация reply-клавиатур**
   - Клавиатуры с множественным выбором
   - Клавиатуры с кнопками контактов/локации

3. **Генерация условных сообщений** (`generateConditionalMessageLogic`)
   - Уже в отдельном файле, но используется inline

4. **Обработка медиа-файлов** (`generateAttachedMediaSendCode`)
   - Уже есть модуль, проверить использование

### Средний приоритет (50-100 строк)

5. **Генерация состояний ожидания ввода** (`waiting_for_input`)
   - Обработка разных типов ввода (text, photo, video, audio, document)
   - Логика накопления данных

6. **Генерация автопереходов**
   - Проверка условий для автоперехода
   - Вызов следующих обработчиков

7. **Обработка ошибок и логирование**
   - safe_edit_or_send
   - Логирование действий пользователя

### Низкий приоритет (<50 строк)

8. **Форматирование текста** (уже есть `formatTextForPython`)
9. **Генерация callback data** (уже есть `generateUniqueShortId`)
10. **Проверка условий переходов**

## Пример рефонаринга (уже выполнен)

**Файл:** `client/src/lib/generate/generateLocationFunctions.ts`

```typescript
/**
 * Функция для генерации Python-функций работы с картографическими сервисами
 * @returns Строка с кодом функций для работы с картами
 */
export function generateLocationFunctions(): string {
  let code = '';

  code += '\n# Функции для работы с картографическими сервисами\n';
  code += 'def extract_coordinates_from_yandex(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Яндекс.Карт"""\n';
  // ... и т.д.

  return code;
}
```

**Вызов в bot-generator.ts:**
```typescript
if (hasLocationFeatures(nodes || [])) {
  code += generateLocationFunctions();
}
```

## Что искать в коде

1. Многострочные строки Python-кода (с `code += '...'`)
2. Паттерны вида:
   - `if (has[X](nodes || [])) { code += ... }`
   - `code += 'def '` — начало Python-функции
   - `code += generate[X]()` — вызов существующих генераторов

## Критерии для вынесения

- Более 30 строк связанного Python-кода
- Функция используется в нескольких местах
- Код имеет чёткую зону ответственности
- Легко тестировать отдельно

## Формат отчёта по рефакторингу

При каждом выносе функции указывать:
1. Имя нового модуля
2. Количество строк кода в модуле
3. Что было заменено (до/после)
4. Какие ещё зависимости нужно создать