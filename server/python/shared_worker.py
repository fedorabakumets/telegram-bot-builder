"""@fileoverview Общий прогретый Python-процесс для внешней очереди обновлений Node."""

import asyncio
import contextlib
import json
import os
import sys
import threading

from shared_protocol import SharedProtocol


async def run():
    """Принимает команды, сохраняя библиотеки между пробуждениями сценариев."""
    import bot_env_overlay
    import lazy_aiogram
    from shared_session import SharedSession

    bot_env_overlay.install()
    lazy_aiogram.enable()
    protocol = SharedProtocol()
    protocol.install()
    commands = asyncio.Queue(maxsize=32)
    loop = asyncio.get_running_loop()
    sessions = {}
    tasks = {}
    finished = threading.Event()

    def enqueue(command):
        """Замедляет stdin при полной очереди вместо накопления команд и callbacks."""
        operation = asyncio.run_coroutine_threadsafe(commands.put(command), loop)
        try:
            operation.result(timeout=10)
        except Exception:
            os._exit(70)

    def read():
        """Передаёт stdin в цикл событий; закрытие канала означает shutdown."""
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
        if not finished.wait(10):
            os._exit(70)

    async def execute(token_id, session):
        """Убирает завершённый сценарий и ссылки на его секреты."""
        try:
            await session.run()
        finally:
            sessions.pop(token_id, None)
            tasks.pop(token_id, None)
            protocol.active.pop(token_id, None)
            protocol.timing.pop(token_id, None)

    threading.Thread(target=read, daemon=True).start()
    # RSS всего дерева публикует сторож: повторное измерение ребёнка давало бы два итога.
    protocol.event("ready")
    try:
        while True:
            command = await commands.get()
            action = command.get("cmd")
            if action == "shutdown":
                break
            if action == "init":
                protocol.event("ready")
                continue
            token_id = int(command.get("token_id", 0))
            if action == "start":
                if token_id in sessions:
                    protocol.event("error", token_id, reason="already_active")
                    continue
                protocol.active[token_id] = command.get("activation_id")
                try:
                    session = SharedSession(command, protocol)
                    sessions[token_id] = session
                    tasks[token_id] = asyncio.create_task(execute(token_id, session))
                except Exception:
                    protocol.event("exited", token_id, code=1, reason="error")
                    protocol.active.pop(token_id, None)
            elif action == "stop" and token_id in sessions:
                if command.get("activation_id") == protocol.active.get(token_id):
                    await sessions[token_id].stop()
                    task = tasks.get(token_id)
                    if task is not None:
                        await task
    finally:
        await asyncio.gather(*(session.stop() for session in list(sessions.values())))
        await asyncio.gather(*list(tasks.values()), return_exceptions=True)
        finished.set()


def main():
    """Настраивает UTF-8 и аварийно завершает общий процесс при потере изоляции."""
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8")
    try:
        # Сторож Windows должен успеть присоединить Job Object до тяжёлых импортов.
        init = json.loads(sys.stdin.readline(1024 * 1024))
        if not isinstance(init, dict) or init.get("cmd") != "init":
            return 70
        asyncio.run(run())
        return 0
    except BaseException:
        return 70


if __name__ == "__main__":
    result = main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(result)
