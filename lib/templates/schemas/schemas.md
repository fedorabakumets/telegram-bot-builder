# Zod схемы шаблонов (schemas/)

## Описание

Централизованные Zod схемы для валидации параметров всех основных шаблонов бота. Используются в `template-renderer.ts` для автоматической валидации перед рендерингом.

## Схемы

| Схема | Файл | Шаблон |
|---|---|---|
| `importsParamsSchema` | `imports-schema.ts` | `imports/imports.py.jinja2` |
| `configParamsSchema` | `config-schema.ts` | `config/config.py.jinja2` |
| `botParamsSchema` | `bot-schema.ts` | `bot.py.jinja2` |
| `headerParamsSchema` | `header-schema.ts` | `header/header.py.jinja2` |
| `databaseParamsSchema` | `database-schema.ts` | `database/database.py.jinja2` |
| `utilsParamsSchema` | `utils-schema.ts` | `utils/utils.py.jinja2` |
| `mainParamsSchema` | `main-schema.ts` | `main/main.py.jinja2` |

## Использование

```typescript
import { configParamsSchema, databaseParamsSchema } from './templates/schemas';

// Валидация параметров
const validated = configParamsSchema.parse({
  userDatabaseEnabled: true,
  projectId: 42,
});
```

## Интеграция с template-renderer

`renderPartialTemplate` автоматически применяет нужную схему по имени шаблона:

```typescript
// Внутри renderPartialTemplate:
const schemaMap = {
  'config': configParamsSchema,
  'database': databaseParamsSchema,
  'imports': importsParamsSchema,
  // ...
};
```

Если схема найдена — параметры валидируются через `schema.parse()` перед передачей в Nunjucks. Ошибка валидации бросает исключение с деталями.

## Структура файлов

```
schemas/
├── bot-schema.ts        (схема для bot.py.jinja2)
├── config-schema.ts     (схема для config.py.jinja2)
├── database-schema.ts   (схема для database.py.jinja2)
├── header-schema.ts     (схема для header.py.jinja2)
├── imports-schema.ts    (схема для imports.py.jinja2)
├── main-schema.ts       (схема для main.py.jinja2)
├── utils-schema.ts      (схема для utils.py.jinja2)
└── index.ts             (реэкспорт всех схем)
```

## Добавление новой схемы

1. Создать файл `<name>-schema.ts` с Zod схемой
2. Экспортировать из `index.ts`
3. Добавить в `schemaMap` в `template-renderer.ts`
