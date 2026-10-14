# Шаблон стикера (sticker.py.jinja2)

Шаг сценария: `bot.send_sticker`, когда выполнение дошло до блока (кнопка или автопереход).

Команда `Command()` не регистрируется. Подпись не передаётся: у `sendSticker` нет `caption`. Поле `command` в данных узла на генерацию не влияет.

## Источник файла

1. `stickerFileId` — file_id
2. `stickerUrl`, начинающийся с `/uploads/` — `FSInputFile`
3. `stickerUrl` с `http://` или `https://` — скачивание через aiohttp
4. прочий непустой `stickerUrl` — считается file_id
5. `stickerSetName` — запасной идентификатор

`autoTransitionTo` вызывает `handle_callback_<цель>`.
