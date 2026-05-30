# Универсальная поддержка динамического callbackPattern

## Проблема

Когда кнопка имеет `customCallbackData` с переменной (например `"approve_{user_id}"`), callback_data в рантайме становится `"approve_6591857297"`. Целевая нода должна ловить этот callback через `startsWith`, а не `==`.

Сейчас это реализовано **вручную** в каждом шаблоне отдельно (message, edit_message). Но таких шаблонов 14+ — патчить каждый неэффективно.

## Текущее состояние

| Нода | Фикс | Как ловит callback |
|------|:---:|---|
| message | ✅ | startsWith (если callbackPattern содержит `{`) |
| edit_message | ✅ | startsWith |
| bot_table | ❌ | `== nodeId` |
| set_variable | ❌ | `== nodeId` |
| condition | ❌ | `== nodeId` |
| delete_message | ❌ | `== nodeId` |
| kick_user | ❌ | `== nodeId` |
| psql_query | ❌ | `== nodeId` |
| convert_file | ❌ | `== nodeId` |
| loop | ❌ | `== nodeId` |
| delay | ❌ | `== nodeId` |
| http_request | ❌ | `== nodeId` |
| keyboard | ❌ | `== nodeId` |
| input | ❌ | `== nodeId` |

## Предлагаемое решение: виртуальный callback_trigger

### Идея

Вместо патчинга каждого шаблона — генерировать **виртуальный callback_trigger** для любой ноды, к которой ведёт кнопка с динамическим `customCallbackData`.

Виртуальный триггер:
1. Ловит callback через `startsWith("prefix_")`
2. Извлекает суффикс в `_cb_dynamic_id`
3. Сохраняет в `user_data[user_id]` и `set_user_var`
4. Вызывает `handle_callback_<targetNodeId>(callback_query)` — передаёт управление целевой ноде

Целевая нода (bot_table, set_variable, любая) продолжает слушать `== nodeId` как обычно. Виртуальный триггер вызывает её напрямую через `await handle_callback_...()`.

### Где генерировать

В `node-handlers.dispatcher.ts` уже есть механизм виртуальных callback_trigger'ов (`collectVirtualCallbackTriggerEntries`). Нужно расширить его:

```typescript
// Для каждой кнопки с customCallbackData содержащим {переменную}:
// 1. Если целевая нода — message или edit_message → они уже обрабатывают сами (фикс в шаблоне)
// 2. Если целевая нода — любая другая → генерируем виртуальный callback_trigger

function collectDynamicCallbackEntries(nodes: Node[]): DynamicCallbackEntry[] {
  const entries: DynamicCallbackEntry[] = [];
  
  for (const node of nodes) {
    const buttons = node.data?.buttons || [];
    for (const btn of buttons) {
      if (btn.customCallbackData && btn.customCallbackData.includes('{') && btn.target) {
        const targetNode = nodes.find(n => n.id === btn.target);
        // Пропускаем message и edit_message — они обрабатывают сами
        if (targetNode && targetNode.type !== 'message' && targetNode.type !== 'edit_message') {
          entries.push({
            callbackPrefix: btn.customCallbackData.split('{')[0],
            targetNodeId: btn.target,
            targetNodeType: targetNode.type,
          });
        }
      }
    }
  }
  
  return entries;
}
```

### Генерируемый Python-код

```python
# Виртуальный обработчик динамического callback для узла read-app-approved
@dp.callback_query(lambda c: c.data and c.data.startswith("read-app-approved_"))
async def _dynamic_cb_read_app_approved(callback_query: types.CallbackQuery, state: FSMContext = None):
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    _cb_suffix = (callback_query.data or "").replace("read-app-approved_", "", 1)
    if _cb_suffix:
        user_data[user_id]["_cb_dynamic_id"] = _cb_suffix
        await set_user_var(user_id, "_cb_dynamic_id", _cb_suffix)
    # Передаём управление целевой ноде
    await handle_callback_read_app_approved(callback_query, state=state)
```

### Преимущества

1. **Один раз** — логика в одном месте (dispatcher), не в 14 шаблонах
2. **Обратная совместимость** — существующие шаблоны не меняются
3. **Универсально** — работает для любого типа ноды
4. **Можно убрать фиксы** из message.py.jinja2 и edit-message.py.jinja2 (они станут избыточными)

### Порядок регистрации

Виртуальные динамические обработчики должны регистрироваться **до** обработчиков целевых нод (чтобы `startsWith` поймал раньше чем `== nodeId`). В aiogram порядок регистрации определяет приоритет.

### Конфликты

Если у ноды есть И обычные кнопки (без customCallbackData) И динамические — нужны оба обработчика:
- `startsWith("prefix_")` — для динамических
- `== "nodeId"` — для обычных (прямой переход)

Это уже работает: виртуальный триггер ловит динамические, а обычный обработчик ноды ловит прямые.

### Что убрать после реализации

- Фикс `_cb_is_dynamic` из `message.py.jinja2` (строки 40-60)
- Фикс `_cb_is_dynamic` из `edit-message.py.jinja2` (строки 20-40)
- `callbackPattern` из `EditMessageEntry` и `MessageTemplateParams`
- Логику `findCustomCallbackDataForNode` из dispatcher (для message/edit_message)

Всё заменяется одним универсальным механизмом.

## Реализация

### Файлы для изменения

1. `lib/templates/node-handlers/node-handlers.dispatcher.ts` — добавить `collectDynamicCallbackEntries()` и генерацию виртуальных обработчиков
2. Новый jinja2 шаблон `lib/templates/dynamic-callback/dynamic-callback.py.jinja2` — шаблон виртуального обработчика
3. Тесты в `lib/tests/` — фазовый тест

### Файлы для очистки (после)

1. `lib/templates/message/message.py.jinja2` — убрать `_cb_is_dynamic` блок
2. `lib/templates/edit-message/edit-message.py.jinja2` — убрать `_cb_is_dynamic` блок
3. `lib/templates/edit-message/edit-message.renderer.ts` — убрать поиск callbackPattern
4. `lib/templates/edit-message/edit-message.params.ts` — убрать `callbackPattern`
5. `lib/templates/edit-message/edit-message.schema.ts` — убрать `callbackPattern`

## Приоритет

Высокий. Блокирует полноценную работу кросс-пользовательских сценариев (заявки, модерация, реферальные системы).
