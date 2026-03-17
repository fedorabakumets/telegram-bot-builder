# Шаблон reply-input-handler

## Описание

Генерирует Python-код обработчика reply-ввода пользователя. Обрабатывает `button_response_config`, `waiting_for_input`, сохраняет ответ и выполняет навигацию.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodes` | `GraphNode[]` | Да | — | Все узлы графа (для goto-навигации) |
| `commandNodes` | `CommandNode[]` | Да | — | Узлы с командами (start/command) |
| `hasUrlButtons` | `boolean` | Да | — | Есть ли URL-кнопки в проекте |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ |

## Пример использования

```typescript
import { generateReplyInputHandler, collectGraphNodes, collectCommandNodes } from './reply-input-handler.renderer';

const nodes = collectGraphNodes(rawNodes);
const commandNodes = collectCommandNodes(rawNodes);
const code = generateReplyInputHandler({ nodes, commandNodes, hasUrlButtons: false });
```

## Тесты

```bash
npm run test:reply-input-handler
```
