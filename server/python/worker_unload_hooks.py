"""@fileoverview Резервное освобождение регистраций одного выгружаемого сценария."""

import asyncio
import inspect


async def cleanup_module_hooks(module, report):
    """Вызывает независимые идемпотентные очистки после завершения задач бота."""
    if module is None:
        return
    # Даём callback завершённых задач снять собственные регистрации ресурсов.
    await asyncio.sleep(0)
    for name in ("_unwrap_message_answer", "_cleanup_redis_log_handler", "_cleanup_media_original"):
        hook = getattr(module, name, None)
        if not callable(hook):
            continue
        try:
            result = hook()
            if inspect.isawaitable(result):
                await result
            elif result is False:
                report(f"Очистка {name} не подтверждена")
        except BaseException:
            # Одна неисправная регистрация не должна мешать освобождению остальных.
            report(f"Не удалось выполнить очистку {name}")
