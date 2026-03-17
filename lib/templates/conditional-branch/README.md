# Шаблон conditional-branch

## Описание

Генерирует Python-код условия `if`/`elif` для одного узла в цепочке условных переходов.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `index` | `number` | Да | — | Индекс узла (0 = `if`, >0 = `elif`) |
| `nodeId` | `string` | Да | — | ID узла |
| `indentLevel` | `string` | Нет | `'            '` | Базовый отступ |

## Пример использования

```typescript
import { generateConditionalBranch } from './conditional-branch.renderer';

const code = generateConditionalBranch({ index: 0, nodeId: 'node_1' });
// if next_node_id == "node_1":

const code2 = generateConditionalBranch({ index: 1, nodeId: 'node_2' });
// elif next_node_id == "node_2":
```

## Тесты

```bash
npm run test:conditional-branch
```
