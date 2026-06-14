# Справочник нод

Ноды — строительные блоки бота на холсте. Каждая нода выполняет одну задачу.

## Два типа нод

- **Триггеры** — точки входа в сценарий. Ловят событие (команда, текст, колбэк, расписание) и запускают цепочку. Не отправляют сообщений.
- **Действия** — всё остальное. Отправка, редактирование, логика, интеграции, управление пользователями.

## Категории в сайдбаре

Так ноды сгруппированы в интерфейсе конструктора:

| Категория | Что внутри |
|-----------|-----------|
| Сообщения | command_trigger, text_trigger, incoming_message_trigger, outgoing_message_trigger, message, media, input (сохранить ответ), edit_message, delete_message, forward_message |
| Клавиатура | callback_trigger, incoming_callback_trigger, keyboard, answer_callback_query |
| Группы | group_message_trigger, create_forum_topic, kick_user |
| Автоматизация | schedule_trigger |
| Интеграции | http_request, psql_query, bot_table, convert_file, condition, set_variable, loop, delay, parallel_split |
| Юзербот | userbot_message, userbot_click_button, userbot_inline_query, userbot_edit_trigger |

## Быстрый поиск

| Хочу... | Нода |
|---------|------|
| Реагировать на команду `/start` | [command_trigger](./triggers/command-trigger.md) |
| Реагировать на произвольный текст | text_trigger |
| Отправить сообщение с кнопками | [message](./actions/message.md) |
| Отправить фото/видео/аудио | media |
| Показать клавиатуру (переиспользуемую) | keyboard |
| Ждать ответ и сохранить в переменную | input |
| Проверить условие | [condition](./logic/condition.md) |
| Сохранить/вычислить переменную | [set_variable](./actions/set-variable.md) |
| Сделать HTTP-запрос к API | http_request |
| Запрос к PostgreSQL | psql_query |
| Работа с таблицей данных | bot_table |
| Отредактировать отправленное сообщение | edit_message |
| Удалить сообщение | delete_message |
| Сделать рассылку | broadcast |
| Задержка перед следующим шагом | delay |
| Цикл по массиву | loop |
| Параллельное выполнение | parallel_split |
| Кикнуть/забанить/замутить пользователя | kick_user, ban_user, mute_user |
| Отправить от имени юзербота | userbot_message |

## Как работает поток

1. **Триггер** ловит событие → переходит к первому действию
2. **Действие** выполняется → через кнопки или `autoTransitionTo` ведёт к следующему
3. Цепочка продолжается пока не закончатся переходы или не встретится **input** (ожидание ответа)

## Клавиатура

Кнопки задаются через отдельную **keyboard-ноду**, которая привязывается к сообщению. Это позволяет переиспользовать одну клавиатуру в нескольких местах и обновлять кнопки без отправки нового сообщения (через editMessageReplyMarkup).

## Триггеры (10 штук)

| Тип | Описание |
|-----|----------|
| `command_trigger` | Команда `/start`, `/help` и т.д. |
| `text_trigger` | Совпадение текста (exact / contains) |
| `incoming_message_trigger` | Любое входящее сообщение |
| `outgoing_message_trigger` | Исходящее сообщение бота |
| `callback_trigger` | Нажатие inline-кнопки (callback_data) |
| `incoming_callback_trigger` | Incoming callback с паттерном |
| `group_message_trigger` | Сообщение в группе |
| `managed_bot_updated_trigger` | Событие управляемого бота |
| `schedule_trigger` | По расписанию (интервал, cron, ежедневно) |
| `userbot_edit_trigger` | Редактирование сообщения (Telethon) |
