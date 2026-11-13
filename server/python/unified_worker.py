"""@fileoverview Общий Python-хост постоянных ботов и выгружаемых сценариев."""

import asyncio
import contextlib
import json
import os
import signal
import sys
import threading


async def run():
    """Обрабатывает ограниченную очередь команд и публикует память ровно один раз."""
    import bot_env_overlay
    import lazy_aiogram
    import worker
    from unified_sessions import UnifiedProtocol, UnifiedSessions

    bot_env_overlay.install()
    lazy_aiogram.enable()
    protocol = UnifiedProtocol()
    protocol.install()
    sessions = UnifiedSessions(worker.BotWorker(), protocol)
    commands = asyncio.Queue(maxsize=32)
    loop = asyncio.get_running_loop()
    finished = threading.Event()

    def enqueue(command):
        """Ограничивает память stdin при задержке обработки команд."""
        operation = asyncio.run_coroutine_threadsafe(commands.put(command), loop)
        try:
            operation.result(timeout=10)
        except Exception:
            os._exit(70)

    def read():
        """Завершает хост при закрытии управляющего канала или слишком большом кадре."""
        while True:
            line = sys.stdin.readline(1024 * 1024 + 1)
            if not line:
                break
            if len(line) > 1024 * 1024 or not line.endswith("\n"):
                os._exit(70)
            try:
                command = json.loads(line)
                if isinstance(command, dict):
                    enqueue(command)
            except (ValueError, TypeError):
                continue
        with contextlib.suppress(RuntimeError):
            enqueue({"cmd": "shutdown"})
        if not finished.wait(30):
            os._exit(70)

    async def report():
        """Публикует единый RSS и безопасные счётчики всех размещённых сценариев."""
        from process_memory import total_rss_kb
        import worker_runtime_counters
        import worker_memory_profile
        while True:
            memory_kb = total_rss_kb()
            if memory_kb is not None:
                worker.emit_system(f"memory_kb:{memory_kb}")
            worker_runtime_counters.report(sessions.contexts())
            worker_memory_profile.report_if_due()
            await asyncio.sleep(10)

    threading.Thread(target=read, daemon=True).start()
    memory_task = asyncio.create_task(report())
    protocol.event("ready")
    worker.emit_system("worker_ready")
    try:
        while True:
            command = await commands.get()
            if command.get("cmd") == "shutdown":
                break
            if command.get("cmd") == "init":
                protocol.event("ready")
                continue
            try:
                await sessions.command(command)
            except (TypeError, ValueError):
                worker.emit_system("invalid_command")
    finally:
        memory_task.cancel()
        await asyncio.gather(memory_task, return_exceptions=True)
        try:
            await sessions.close()
        finally:
            finished.set()


def main():
    """Сохраняет рукопожатие сторожа и запрещает ботам заменять обработчики сигналов."""
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8")
    try:
        init = json.loads(sys.stdin.readline(1024 * 1024))
        if not isinstance(init, dict) or init.get("cmd") != "init":
            return 70
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal = lambda *args, **kwargs: None
        asyncio.run(run())
        return 0
    except BaseException:
        return 70


if __name__ == "__main__":
    result = main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(result)
