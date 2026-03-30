# Шаблон conditional-input-handler

## Описание

Генерирует Python-код обработчика условного ввода пользователя. Обрабатывает состояние `waiting_for_conditional_input`, сохраняет ответ и выполняет навигацию к следующему узлу.

Если в проекте нет кнопок с `skipDataCollection=true`, runtime-блок для пропуска не добавляется.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodes` | `ConditionalNavNode[]` | Да | — | Все узлы графа |
| `allNodeIds` | `string[]` | Да | — | Все ID узлов |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ |

## Пример использования

```typescript
import { generateConditionalInputHandler, collectConditionalNavNodes } from './conditional-input-handler.renderer';

const nodes = collectConditionalNavNodes(rawNodes);
const code = generateConditionalInputHandler({ nodes, allNodeIds: ['node_1', 'node_2'] });
```

## Тесты

```bash
npm run test:conditional-input-handler
```
