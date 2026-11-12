"""@fileoverview Изолированный временный обработчик, получающий секреты только через stdin."""

import asyncio
import contextlib
import json
import os
import sys
import threading
import process_startup_timing as startup_timing


def event(name):
    """Публикует только фиксированное событие, не раскрывая входную конфигурацию."""
    print(json.dumps({"type": "process", "event": name, "pid": os.getpid()}), flush=True)


async def run_child(init):
    """Загружает один модуль; штатная остановка и простой завершают процесс с кодом ноль."""
    startup_timing.mark("imports_begin")
    import bot_env_overlay
    import worker as worker_module
    from process_child_feed import ProcessChildFeed
    from worker import BotContext, BotWorker
    startup_timing.mark("imports_done")

    bot_env_overlay.install()
    original_system = worker_module.emit_system

    def child_system(content):
        """Отделяет готовность временного обработчика от жизненного цикла регистрации бота."""
        if content.startswith("bot_started:"):
            event("ready")
        else:
            original_system(content)

    worker_module.emit_system = child_system
    ctx = BotContext(int(init["token_id"]), init["token"], init["bot_file"])
    ctx.env = dict(init.get("env") or {})
    ctx.project_id = int(init.get("project_id", 0))
    idle = float(init["idle"])
    if not 0.1 <= idle <= 86400:
        raise ValueError("Недопустимый таймер простоя")
    adapter = ProcessChildFeed(ctx, ctx.env["REDIS_URL"], idle)
    startup_timing.mark("redis_begin")
    await adapter.queue.open()
    startup_timing.mark("redis_done")
    loop = asyncio.get_running_loop()
    stop = asyncio.Event()
    finished = threading.Event()

    def listen():
        """Следит за управляющим каналом; EOF также требует завершения обработчика."""
        for line in sys.stdin:
            try:
                command = json.loads(line)
            except (ValueError, TypeError):
                continue
            if isinstance(command, dict) and command.get("cmd") == "stop":
                break
        with contextlib.suppress(RuntimeError):
            loop.call_soon_threadsafe(stop.set)
        if not finished.wait(10):
            # Изолированная Linux-сессия не должна оставлять потомков после потери Node.
            if os.name == "posix" and os.getpgrp() == os.getpid():
                import signal
                os.killpg(os.getpgrp(), signal.SIGKILL)
            os._exit(70)

    threading.Thread(target=listen, daemon=True).start()
    worker = BotWorker()
    task = asyncio.create_task(worker._run_bot(ctx, adapter))
    stopper = asyncio.create_task(stop.wait())
    try:
        done, _ = await asyncio.wait((task, stopper), return_when=asyncio.FIRST_COMPLETED)
        if stopper in done and not task.done():
            adapter.stopping.set()
            hook = getattr(ctx.module, "request_bot_stop", None)
            if callable(hook):
                hook()
            try:
                await asyncio.wait_for(asyncio.shield(task), 5)
            except asyncio.TimeoutError:
                task.cancel()
                try:
                    await asyncio.wait_for(task, 2)
                except asyncio.TimeoutError:
                    os._exit(70)
        await task
        if ctx.status == "error":
            event("error")
            return 1
        if adapter.idled:
            event("idle")
        return 0
    finally:
        finished.set()
        stopper.cancel()
        await asyncio.gather(stopper, return_exceptions=True)
        await adapter.queue.close()


def main():
    """Читает начальный JSON из закрытого канала без вывода токена и ошибок с данными."""
    if sys.platform == "win32":
        sys.stdin.reconfigure(encoding="utf-8")
        sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
        sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
    try:
        startup_timing.enable()
        init = json.loads(sys.stdin.readline(1024 * 1024))
        if not isinstance(init, dict):
            raise ValueError("Некорректная команда запуска")
        return asyncio.run(run_child(init))
    except BaseException:
        event("error")
        return 1


if __name__ == "__main__":
    result = main()
    # Читающий stdin daemon не должен блокировать финализацию стандартных потоков.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(result)
