# Типы (Types)

**Модуль:** `components/editor/properties/types`

## 📁 Структура

```
types/
├── conditional.types.ts      # Типы для условных сообщений
├── media.types.ts            # Типы для медиа
└── index.ts                  # Баррел-экспорт
```

## 📦 Использование

### Импорт типов

```typescript
// Импорт конкретного типа
import type { RuleConflict } from 'components/editor/properties/types';

// Импорт из баррела
import type {
  RuleConflict,
  ConditionalRule,
  ProjectVariable,
  MediaFile,
  MediaType
} from 'components/editor/properties/types';
```

## 📝 API

### Условные сообщения

#### RuleConflict

Конфликт правил условных сообщений.

```typescript
interface RuleConflict {
  ruleIndex: number;
  conflictType: 'duplicate' | 'contradiction' | 'unreachable' | 'missing_variables' | 'missing_value';
  description: string;
  severity: 'warning' | 'error';
  suggestion: string;
}
```

#### ConditionalRule

Правило условного сообщения.

```typescript
interface ConditionalRule {
  condition?: string;
  variableName?: string;
  variableNames?: string[];
  expectedValue?: string;
  logicOperator?: string;
  priority?: number;
  id?: string;
  [key: string]: unknown;
}
```

#### ProjectVariable

Переменная проекта.

```typescript
interface ProjectVariable {
  name: string;
  nodeId: string;
  nodeType: string;
  description?: string;
  mediaType?: string;
}
```

### Медиа

#### MediaType

Тип медиафайла.

```typescript
type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';
```

#### MediaUploadParams

Параметры загрузки медиафайла.

```typescript
interface MediaUploadParams {
  file: File;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  onProgress?: (progress: number) => void;
}
```

#### MultipleMediaUploadParams

Параметры массовой загрузки.

```typescript
interface MultipleMediaUploadParams {
  files: File[];
  defaultDescription?: string;
  isPublic?: boolean;
  onProgress?: (progress: number) => void;
  onFileProgress?: (fileIndex: number, progress: number) => void;
}
```

#### MultipleUploadResult

Результат массовой загрузки.

```typescript
interface MultipleUploadResult {
  success: number;
  errors: number;
  uploadedFiles: MediaFile[];
  errorDetails: unknown[];
  statistics: Record<string, unknown>;
}
```

## 🎯 Принципы

1. **Использовать `type` для union типов**
2. **Использовать `interface` для объектов**
3. **Избегать `any`** — использовать `unknown`
4. **JSDoc комментарии** — для всех типов
5. **Экспортировать все типы** — для переиспользования
