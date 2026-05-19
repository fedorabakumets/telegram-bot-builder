# Шаблон `delay`

## Описание

Генерирует Python-код для паузы (blocking) или фонового таймера (background).

## Режимы

| Режим | Поведение | Python |
|---|---|---|
| blocking | Ждёт N секунд, потом переходит | `await asyncio.sleep(N)` |
| background | Запускает таймер в фоне, цепочка завершается | `asyncio.create_task(...)` |

## Единицы времени

seconds, minutes, hours, days, weeks — конвертируются в секунды.

## Переменные

Поле `seconds` поддерживает `{переменные}` через `replace_variables_in_text`.
