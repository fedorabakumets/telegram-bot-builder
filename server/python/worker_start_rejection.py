"""@fileoverview Терминальное подтверждение отказа до регистрации задачи бота."""


def reject_start(token_id, bots, message, emit_log, emit_system):
    """Сообщить об отказе, освобождая резерв запуска только незапущенного бота.

    Некорректный идентификатор не должен попадать в системный протокол,
    а повторная ошибочная команда не должна завершать уже работающего бота.
    Текст сообщения задаётся вызывающим кодом без содержимого env и токена.
    """
    valid_id = type(token_id) is int and token_id > 0
    emit_log(token_id if valid_id else 0, message, "stderr")
    if valid_id and token_id not in bots:
        emit_system(f"bot_exited:{token_id}:error")
