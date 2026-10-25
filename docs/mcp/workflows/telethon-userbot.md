# Workflow: telethon-userbot

Telethon Userbot: db_set_userbot_settings → db_userbot_send_code → db_userbot_sign_in → при needs_2fa db_userbot_sign_in_2fa → db_restart_bot по просьбе.

Не выполняй live-операции без подтверждённого проекта и явной просьбы пользователя. После изменения проверь фактический ответ MCP.
