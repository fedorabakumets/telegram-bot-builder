# Input-нода

## Простыми словами

`input` не задаёт вопрос сама: предыдущая `message` показывает вопрос, а `input` ждёт следующий ответ пользователя и сохраняет его в переменную.

## Формат

```json
{
  "type": "input",
  "data": {
    "inputVariable": "first_number",
    "inputType": "text",
    "inputTargetNodeId": "next_node",
    "validationType": "number",
    "retryMessage": "Введите число"
  }
}
```

`inputVariable` — имя переменной без скобок. В следующих нодах значение доступно как `{first_number}`. `inputType` поддерживает `text`, `photo`, `video`, `audio`, `document`, `location`, `contact`, `any` и `callback`.

## Валидация и ошибки

Для текста доступны `validationType: "none" | "email" | "phone" | "number"`. При ошибке проверки пользователь получает `retryMessage`, а FSM продолжает ждать тот же ввод. Для собственной проверки используй `condition` или `code` после сохранения значения.

`inputRequired`, `minLength`, `maxLength` и `appendVariable` задают обязательность, длину и способ записи. Не добавляй поля, которых нет в схеме ноды.

## Таймаут, отмена и кнопки

`inputTimeout` задаётся в секундах. После таймаута FSM сбрасывается и отправляется `inputTimeoutMessage`. При активном ожидании автоматически доступна команда `/cancel`, которая сбрасывает форму.

Для кнопок используй `keyboard` → `input` с `inputType: "callback"`; текст нажатой кнопки сохраняется в `inputVariable`.

## Полный сценарий калькулятора

```text
command_trigger(/start)
→ message «Введите первое число»
→ input(first_number, validationType=number)
→ message «Введите второе число»
→ input(second_number, validationType=number)
→ message с keyboard «+ − × ÷»
→ input(operation, inputType=callback)
→ code вычисляет answer
→ message «Результат: {answer}»
```

## Важно

В одной ветке не создавай несколько конкурирующих `input`: FSM ожидает один следующий ответ. После изменения проверь `inputTargetNodeId` и весь проект валидатором.
