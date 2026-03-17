# Шаблон parse-mode

## Описание

Генерирует Python-код для выбора `parse_mode` (Markdown, HTML или None) с учётом условного parse_mode.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `formatMode` | `string` | Нет | — | Режим форматирования: `'markdown'`, `'html'` или пусто |
| `markdown` | `boolean` | Нет | — | Флаг markdown (устаревший) |
| `indentLevel` | `string` | Нет | `'                '` | Базовый отступ |

## Тесты

```bash
npm run test:parse-mode
```
