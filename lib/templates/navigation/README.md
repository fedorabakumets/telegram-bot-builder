# Шаблон navigate-to-node

## Описание

Генерирует вспомогательную функцию `navigate_to_node` для навигации к узлу с отправкой сообщения.

## Параметры

Параметры не нужны — функция статическая.

## Пример использования

```typescript
import { generateNavigateToNode, generateNavigateToNodeCall } from './navigate-to-node.renderer';

// Генерация функции
const funcCode = generateNavigateToNode();

// Генерация вызова
const callCode = generateNavigateToNodeCall('node_1', 'message', '    ');
// => await navigate_to_node(message, "node_1")
```

## Тесты

```bash
npm run test:navigation
```
