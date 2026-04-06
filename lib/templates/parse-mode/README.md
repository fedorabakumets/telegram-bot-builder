# Шаблон parse-mode

## Описание

Генерирует Python-код для выбора `parse_mode` (Markdown, HTML или None) с учётом условного parse_mode.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `formatMode` | `string` | Нет | — | Режим форматирования: `'markdown'`, `'html'` или пусто |
| `markdown` | `boolean` | Нет | — | Флаг markdown (устаревший, используйте `formatMode`) |
| `indentLevel` | `string` | Нет | `'                '` | Базовый отступ |

## Приоритет formatMode над markdown

Если заданы оба параметра одновременно — `formatMode` имеет приоритет над устаревшим флагом `markdown`.

| `formatMode` | `markdown` | Результат |
|---|---|---|
| `'html'` | `true` | `ParseMode.HTML` |
| `'markdown'` | `true` | `ParseMode.MARKDOWN` |
| `'none'` | `true` | `ParseMode.MARKDOWN` (legacy fallback) |
| `'none'` | `false` | `None` |
| не задан | `true` | `ParseMode.MARKDOWN` (legacy fallback) |

### Предупреждение при конфликте

Если одновременно заданы `markdown: true` и `formatMode` (не `'none'`), функция `buildParseModeParams` выводит предупреждение в консоль:

```
[parse-mode] Конфликт: markdown=true и formatMode="html" для узла <id>. Используется formatMode.
```

Это помогает обнаружить устаревшие данные в узлах и перейти на `formatMode`.

## Использование

```typescript
import { generateParseMode, buildParseModeParams } from './parse-mode.renderer';

// Прямой вызов
const code = generateParseMode({ formatMode: 'html', indentLevel: '    ' });

// Из данных узла (с предупреждением при конфликте)
const params = buildParseModeParams(node, '    ');
const code = generateParseMode(params);
```

## Тесты

```bash
npm run test:parse-mode
```
