# Шаблон multiselect-check

## Описание

Генерирует Python-код проверки режима множественного выбора. Обрабатывает кнопки выбора, кнопку "Готово" и goto-переходы.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodes` | `MultiSelectNode[]` | Да | — | Все узлы графа |
| `allNodeIds` | `string[]` | Да | — | Все ID узлов |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ |

## Пример использования

```typescript
import { generateMultiSelectCheck, collectMultiSelectNodes } from './multiselect-check.renderer';

const nodes = collectMultiSelectNodes(rawNodes);
const code = generateMultiSelectCheck({ nodes, allNodeIds: ['node_1', 'node_2'] });
```

## Тесты

```bash
npm run test:multiselect-check
```
