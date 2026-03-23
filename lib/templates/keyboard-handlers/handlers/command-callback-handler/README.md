# command-callback-handler

Генерация обработчика callback для командных кнопок Telegram ботов.

## Назначение

Шаблон генерирует Python код для обработки нажатий на callback кнопки с командами.

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `callbackData` | `string` | Callback data для идентификации кнопки |
| `button` | `CommandButton` | Объект кнопки с полями action, id, target, text |
| `indentLevel` | `string` | Уровень отступа (по умолчанию `''`) |

## Пример использования

```typescript
import { generateCommandCallbackHandler } from '../../templates/handlers';

const code = generateCommandCallbackHandler({
  callbackData: 'cmd_btn_start_123',
  button: {
    action: 'command',
    id: 'btn_start',
    target: 'start',
    text: 'Запустить бота',
  },
});

console.log(code);
```

## Пример вывода

```python
@dp.callback_query(lambda c: c.data == "cmd_btn_start_123")
async def handle_callback_cmd_btn_start_123(callback_query: types.CallbackQuery):
    # Проверяем флаг hideAfterClick для кнопок
    # Обработка hideAfterClick не применяется в этом обработчике
    await callback_query.answer()
    user_id = callback_query.from_user.id
    # Инициализируем базовые переменные пользователя
    user_name = await init_user_variables(user_id, callback_query.from_user)
    
    button_text = "Запустить бота"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Команда start выполнена через callback кнопку (пользователь {user_id})")
```

## Особенности

1. **Сохранение в БД** — автоматически сохраняет нажатие кнопки в базу данных
2. **Инициализация переменных** — вызывает `init_user_variables` для пользователя
3. **Логирование** — логирует выполнение команды с ID пользователя

## Структура файлов

```
command-callback-handler/
├── command-callback-handler.py.jinja2    # Jinja2 шаблон
├── command-callback-handler.params.ts    # TypeScript интерфейс
├── command-callback-handler.schema.ts    # Zod схема
├── command-callback-handler.renderer.ts  # Функция рендеринга
├── command-callback-handler.fixture.ts   # Тестовые фикстуры
├── command-callback-handler.test.ts      # Тесты
└── README.md                             # Документация
```
