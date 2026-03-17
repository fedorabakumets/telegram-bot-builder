# Шаблон auto-transition

## Описание

Генерирует Python-код автоперехода к целевому узлу. Используется когда узел должен автоматически перейти к следующему узлу без действий пользователя.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodeId` | `string` | Да | — | ID текущего узла |
| `autoTransitionTarget` | `string` | Да | — | ID целевого узла |
| `targetExists` | `boolean` | Да | — | Существует ли целевой узел в графе |
| `indentLevel` | `string` | Нет | `'    '` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateAutoTransition } from './auto-transition.renderer';

const code = generateAutoTransition({
  nodeId: 'node_1',
  autoTransitionTarget: 'node_2',
  targetExists: true,
});
```

**Вывод:**

```python
    if not is_fake_callback:
        logging.info(f"⚡ Автопереход от узла node_1 к узлу node_2")
        await handle_callback_node_2(callback_query)
        logging.info(f"✅ Автопереход выполнен: node_1 -> node_2")
        return
```

## Тесты

```bash
npm run test:auto-transition
```
