# Утилиты (Utils)

**Модуль:** `components/editor/properties/utils`

## 📁 Структура

```
utils/
├── conditional-utils.ts      # Утилиты условных сообщений
├── node-utils.ts             # Утилиты узлов
├── node-formatters.ts        # Форматирование узлов
├── node-constants.ts         # Константы узлов
├── node-defaults.ts          # Данные по умолчанию
├── variables-utils.ts        # Утилиты переменных
├── media-utils.ts            # Медиа утилиты
└── api-validation.ts         # Валидация API ответов
```

## 📦 Использование

### Валидация API ответов

```typescript
import { validateMediaFilesArray } from 'components/editor/properties/utils';

const response = await fetch('/api/media/project/123');
const data = await response.json();

const validation = validateMediaFilesArray(data);
if (!validation.isValid) {
  throw new Error(`Ошибка валидации: ${validation.errors.map(e => e.message).join(', ')}`);
}

// data теперь типизирована как MediaFile[]
return validation.data as MediaFile[];
```

### Условные сообщения

```typescript
import { detectRuleConflicts, autoFixRulePriorities } from 'components/editor/properties/utils';

const rules = [
  { condition: 'first_time', priority: 0 },
  { condition: 'user_data_exists', variableName: 'email', priority: 0 }
];

// Обнаружение конфликтов
const conflicts = detectRuleConflicts(rules);
// [{ ruleIndex: 0, conflictType: '...', description: '...' }]

// Автоисправление приоритетов
const fixedRules = autoFixRulePriorities(rules);
// [{ condition: 'first_time', priority: 100 }, ...]
```

### Переменные

```typescript
import { extractVariables, collectAvailableQuestions } from 'components/editor/properties/utils';

// Извлечение переменных из узлов
const { textVariables, mediaVariables } = extractVariables(allNodes);

// Сбор доступных вопросов
const questions = collectAvailableQuestions(allNodes);
```

### Узлы

```typescript
import { collectAllNodesFromSheets, formatNodeDisplay } from 'components/editor/properties/utils';

// Сбор узлов из всех листов
const allNodes = collectAllNodesFromSheets(sheets, nodes, currentSheetId);

// Форматирование отображения
const display = formatNodeDisplay(node, sheetName);
```

## 📝 API

### validateMediaFilesArray

**Параметры:**
- `files: unknown` — проверяемый массив

**Возвращает:**
- `ValidationResult<MediaFile[]>` — результат валидации

### detectRuleConflicts

**Параметры:**
- `rules: ConditionalRule[]` — массив правил

**Возвращает:**
- `RuleConflict[]` — массив конфликтов

### autoFixRulePriorities

**Параметры:**
- `rules: ConditionalRule[]` — массив правил

**Возвращает:**
- `ConditionalRule[]` — правила с исправленными приоритетами

### extractVariables

**Параметры:**
- `allNodes: Node[]` — все узлы

**Возвращает:**
- `VariablesResult` — объект с `textVariables` и `mediaVariables`

## 🎯 Принципы

1. **Чистые функции** — без побочных эффектов
2. **Иммутабельность** — не мутировать входные данные
3. **Строгая типизация** — никаких `any`, использовать `unknown`
4. **JSDoc комментарии** — для всех экспортов
5. **Минимальные зависимости** — только необходимое
