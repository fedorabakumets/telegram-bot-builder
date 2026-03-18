# handle-node-function

Шаблон для генерации Python async-функций `handle_node_*` — обработчиков узлов с условными сообщениями и сбором пользовательского ввода.

## Когда используется

Функции `handle_node_*` генерируются только для узлов, у которых одновременно:
- `enableConditionalMessages: true` — включены условные сообщения
- `conditionalMessages.length > 0` — есть хотя бы одно условие
- `collectUserInput: true` — узел ожидает ввод от пользователя

## Параметры

| Поле | Тип | Описание |
|------|-----|----------|
| `nodeId` | `string` | Уникальный ID узла |
| `safeName` | `string` | Безопасное имя (спецсимволы → `_`) |
| `messageText` | `string?` | Текст сообщения (fallback) |
| `formatMode` | `string?` | `html` / `markdown` / `none` |
| `imageUrl` | `string?` | URL изображения |
| `attachedMedia` | `string[]?` | Прикреплённые медиафайлы |
| `enableConditionalMessages` | `boolean?` | Включены ли условные сообщения |
| `conditionalMessages` | `ConditionalMessage[]?` | Список условий |
| `variableFiltersJson` | `string?` | JSON фильтров переменных |
| `enableAutoTransition` | `boolean?` | Включён ли автопереход |
| `autoTransitionTo` | `string?` | safeName целевого узла автоперехода |
| `collectUserInput` | `boolean?` | Ожидать ли ввод пользователя |
| `inputType` | `string?` | Тип ввода (`text`, `number`, ...) |
| `inputTargetNodeId` | `string?` | ID узла-цели после ввода |
| `usedVariables` | `string[]?` | Переменные для загрузки из БД |

## Использование

```typescript
import { generateHandleNodeFunction, generateHandleNodeFunctions } from './handle-node-function.renderer';

// Одна функция
const code = generateHandleNodeFunction({
  nodeId: 'node_abc',
  safeName: 'node_abc',
  messageText: 'Введите имя:',
  enableConditionalMessages: true,
  conditionalMessages: [{ variableName: 'is_vip', messageText: 'VIP приветствие!' }],
  collectUserInput: true,
});

// Из массива EnhancedNode
const allCode = generateHandleNodeFunctions(nodes, mediaVariablesMap);
```

## Генерируемый Python код

```python
async def handle_node_node_abc(message: types.Message):
    """Обработчик узла node_abc с условными сообщениями"""
    user_id = message.from_user.id
    # ... инициализация переменных ...
    if check_user_variable_inline("is_vip", user_data_dict)[0]:
        text = "VIP приветствие!"
    else:
        text = "Введите имя:"
    # ... замена переменных, отправка сообщения ...
    user_data[user_id]["waiting_for_input"] = "node_abc"
    return
```
