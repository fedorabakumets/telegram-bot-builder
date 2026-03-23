# multi-select-transition

Генерация логики переходов для завершения множественного выбора в Telegram ботах.

## Назначение

Шаблон генерирует Python код для определения следующего узла после завершения операции множественного выбора (нажатия кнопки "Готово").

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `multiSelectNodes` | `MultiSelectNodeForTransition[]` | Узлы с множественным выбором |
| `nodes` | `Node[]` | Все узлы графа |
| `connections` | `NodeConnection[]` | Соединения между узлами (опционально) |
| `indentLevel` | `string` | Уровень отступа (по умолчанию `'        '`) |

## Пример использования

```typescript
import { generateMultiSelectTransition } from '../../templates/handlers';

const code = generateMultiSelectTransition({
  multiSelectNodes: [
    {
      id: 'interests_node',
      data: {
        continueButtonTarget: 'result_node',
        keyboardType: 'inline',
        messageText: 'Выбор завершен',
      },
    },
  ],
  nodes: [
    {
      id: 'interests_node',
      type: 'message',
      data: {
        allowMultipleSelection: true,
        messageText: 'Выберите интересы:',
      },
    },
    {
      id: 'result_node',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Спасибо за выбор!',
      },
    },
  ],
});

console.log(code);
```

## Пример вывода

```python
# Определяем следующий узел для каждого node_id
if node_id == "interests_node":
    # Переход к узлу result_node
    logging.info(f"🔄 Переходим к узлу result_node (тип: message)")
    # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!
    text = "Спасибо за выбор!"
    await callback_query.message.answer(text)
    return
```

## Особенности

1. **Приоритет continueButtonTarget** — сначала проверяется `continueButtonTarget`, затем соединения
2. **Поддержка типов узлов** — обработка message, command, start узлов
3. **Генерация клавиатуры** — для inline узлов целевого узла
4. **Обработка ошибок** — предупреждения для несуществующих узлов

## Логика работы

1. Для каждого узла множественного выбора генерируется блок `if node_id == "..."`
2. Если указан `continueButtonTarget`:
   - Находим целевой узел
   - Генерируем код перехода в зависимости от типа узла
3. Если нет `continueButtonTarget`:
   - Используем первое соединение из узла
4. Если блок остался пустым — добавляем `return`

## Структура файлов

```
multi-select-transition/
├── multi-select-transition.py.jinja2    # Jinja2 шаблон
├── multi-select-transition.params.ts    # TypeScript интерфейс
├── multi-select-transition.schema.ts    # Zod схема
├── multi-select-transition.renderer.ts  # Функция рендеринга
├── multi-select-transition.fixture.ts   # Тестовые фикстуры
├── multi-select-transition.test.ts      # Тесты
└── README.md                            # Документация
```
