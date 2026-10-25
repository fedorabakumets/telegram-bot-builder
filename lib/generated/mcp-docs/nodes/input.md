# Input-нода

## Назначение

`input` сама вопрос не отправляет: предыдущая `message` показывает его, а `input` ожидает следующее событие Telegram и сохраняет полезную нагрузку в переменную.

## Поля

| Поле | Тип | Значение/ограничение |
|---|---|---|
| `inputVariable` | string | имя без скобок |
| `inputType` | enum | `text`, `photo`, `video`, `audio`, `document`, `location`, `contact`, `any`, `callback` |
| `inputTargetNodeId` | string | ID цели или пусто |
| `validationType` | enum | `none`, `email`, `phone`, `number` для текста |
| `retryMessage` | string | повторный запрос при ошибке |
| `inputRequired` | boolean | запрет пустого значения |
| `minLength`, `maxLength` | number | ограничения длины текста |
| `inputTimeout` | number | секунды ожидания |

```json
{"type":"input","data":{"inputVariable":"email","inputType":"text","validationType":"email","retryMessage":"Введите корректный email","inputTargetNodeId":"save"}}
```

## Поведение

`text` сохраняет текст; `photo`, `video`, `audio`, `document`, `location` и `contact` — соответствующую Telegram-полезную нагрузку; `any` принимает допустимое сообщение; `callback` ожидает нажатие inline-кнопки. После успеха значение доступно как `{email}`. При невалидном вводе ожидание остаётся активным и отправляется `retryMessage`. После timeout FSM сбрасывается и отправляется `inputTimeoutMessage`; `/cancel` сбрасывает ожидание.

Для бизнес-правил, которых нет среди встроенных `validationType`, используй `condition` или `code` после сохранения. На одной ветке должен быть один ожидающий input: несколько конкурирующих узлов могут перехватить событие непредсказуемо.

## Примеры

Число: `inputType: "text"`, `validationType: "number"`. Callback: `keyboard` с callback-кнопкой → `input` с `inputType: "callback"`. Файл: `inputType: "document"`, затем `code` или `convert_file`.

## Частые ошибки

- В `inputVariable` указаны `{скобки}` — нужны только имя и допустимые символы.
- Вопрос пытаются задать самим input — добавь предыдущую `message`.
- Callback направлен в обычный text-input — поставь `inputType: "callback"`.
- Не указан `retryMessage` при обязательной проверке.

## Связанные ноды

`message`, `keyboard`, `callback_trigger`, `condition`, `code`, `set_variable`, `convert_file`.

## Как проверить результат

Проверь `get_node_schema(input)`, `get_node_example(input)`, `validate_node`, затем отправь валидный и невалидный ответ. Просмотр runtime-контекста отдельным MCP-инструментом не реализован; используй логи.

## Следующий шаг

Соедини успешный input с `message`, `condition` или `code` и не создавай второй активный input на той же ветке.
