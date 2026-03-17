# Типы параметров шаблонов (types/)

## Описание

TypeScript интерфейсы для параметров всех основных шаблонов бота. Служат контрактом между TypeScript-кодом и Jinja2 шаблонами — описывают что именно передаётся в каждый шаблон.

## Типы

| Интерфейс | Файл | Шаблон |
|---|---|---|
| `ImportsTemplateParams` | `imports-params.ts` | `imports/imports.py.jinja2` |
| `ConfigTemplateParams` | `config-params.ts` | `config/config.py.jinja2` |
| `BotTemplateParams`, `BotNode` | `bot-params.ts` | `bot.py.jinja2` |
| `HeaderTemplateParams` | `header-params.ts` | `header/header.py.jinja2` |
| `DatabaseTemplateParams` | `database-params.ts` | `database/database.py.jinja2` |
| `UtilsTemplateParams` | `utils-params.ts` | `utils/utils.py.jinja2` |
| `MainTemplateParams` | `main-params.ts` | `main/main.py.jinja2` |
| `KeyboardLayout`, `KeyboardRow` | `keyboard-layout.ts` | (вспомогательные типы) |

## Использование

```typescript
import type { ConfigTemplateParams, BotTemplateParams } from './templates/types';

const config: ConfigTemplateParams = {
  userDatabaseEnabled: true,
  projectId: 42,
};
```

## KeyboardLayout

Вспомогательный тип для описания раскладки клавиатуры:

```typescript
interface KeyboardLayout {
  rows: KeyboardRow[];   // ряды кнопок
  columns: number;       // количество колонок (1–6)
  autoLayout: boolean;   // автоматическая раскладка
}

interface KeyboardRow {
  buttonIds: string[];   // ID кнопок в ряду
}
```

## Связь со schemas/

Каждому интерфейсу в `types/` соответствует Zod схема в `schemas/`:

```
types/config-params.ts  →  schemas/config-schema.ts
types/database-params.ts →  schemas/database-schema.ts
...
```

Интерфейсы описывают форму данных, схемы — валидируют и применяют дефолты.

## Структура файлов

```
types/
├── bot-params.ts        (BotTemplateParams, BotNode)
├── config-params.ts     (ConfigTemplateParams)
├── database-params.ts   (DatabaseTemplateParams)
├── header-params.ts     (HeaderTemplateParams)
├── imports-params.ts    (ImportsTemplateParams)
├── keyboard-layout.ts   (KeyboardLayout, KeyboardRow)
├── main-params.ts       (MainTemplateParams)
├── utils-params.ts      (UtilsTemplateParams)
└── index.ts             (реэкспорт всех типов)
```
