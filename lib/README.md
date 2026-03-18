# lib — Bot Generator Library

Библиотека генерации Python-кода для Telegram-ботов на базе aiogram.

## Структура

```
lib/
├── bot-generator/       # Ядро генератора
│   ├── core/            # Контекст, состояние, логирование, утилиты
│   ├── types/           # TypeScript-типы и интерфейсы
│   └── validation/      # Валидация узлов и сгенерированного кода
├── templates/           # Jinja2-шаблоны и TypeScript-рендереры
│   ├── <template>/      # Каждый шаблон: .py.jinja2 + renderer + schema + tests
│   ├── filters/         # Предикаты и фильтры узлов (hasInputCollection и др.)
│   ├── schemas/         # Zod-схемы для параметров шаблонов
│   └── types/           # Общие типы параметров шаблонов
├── scaffolding/         # Генерация файлов проекта (Dockerfile, requirements.txt и др.)
├── bot-generator.ts     # Главная функция generatePythonCode()
├── commands.ts          # Генерация команд для BotFather
└── index.ts             # Единая точка входа библиотеки
```

## Модули

### `bot-generator/core/`

Ядро генератора: создание контекста (`create-generation-context`), управление состоянием (`generation-state`), централизованное логирование (`generator-logger`), утилиты обхода узлов.

### `bot-generator/types/`

Все TypeScript-типы: `BotNode`, `NodeData`, `EnhancedNode`, `InputCollectionCheckResult`, `GenerationContext` и др. Единственная точка импорта типов через `index.ts`.

### `bot-generator/validation/`

Валидация `EnhancedNode` перед генерацией (`validate-enhanced-node`) и проверка обязательных компонентов в сгенерированном Python-коде (`validate-generated-python`).

### `templates/`

Jinja2-шаблоны с TypeScript-рендерерами. Каждый шаблон — отдельная папка с файлами `.py.jinja2`, `.renderer.ts`, `.schema.ts`, `.params.ts`, `.test.ts`. Рендеринг через `template-renderer.ts` (Nunjucks).

### `scaffolding/`

Генерация вспомогательных файлов проекта: `Dockerfile`, `requirements.txt`, `.env`, `README.md`.

## Точка входа

```typescript
import { generatePythonCode } from 'lib';
import type { BotNode, GenerationOptions } from 'lib';
```
