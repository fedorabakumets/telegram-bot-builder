"""@fileoverview Запуск и обязательное завершение отдельного обработчика бота."""

import asyncio
import contextlib
import json
import os
import signal
import sys
from pathlib import Path

from process_handler_io import secret_environment_key, FRAME_LIMIT, child_environment, drain
from process_memory import register_pid, unregister_pid
from process_job import attach_job, close_job, add_process


async def stop_process(process, timeout=10):
    """Просит завершение, затем принудительно останавливает и ожидает процесс."""
    if process.returncode is not None:
        return
    try:
        process.stdin.write(b'{"cmd":"stop"}\n')
        await asyncio.wait_for(process.stdin.drain(), 1)
    except (BrokenPipeError, ConnectionResetError, asyncio.TimeoutError):
        pass
    try:
        await asyncio.wait_for(wait_exit(process), timeout)
        return
    except asyncio.TimeoutError:
        pass
    if os.name == "nt":
        killer = await asyncio.create_subprocess_exec(
            "taskkill", "/PID", str(process.pid), "/T", "/F",
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await killer.wait()
    else:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(process.pid, signal.SIGTERM)
    try:
        await asyncio.wait_for(wait_exit(process), 3)
    except asyncio.TimeoutError:
        with contextlib.suppress(ProcessLookupError):
            if os.name == "nt":
                process.kill()
            else:
                os.killpg(process.pid, signal.SIGKILL)
        await wait_exit(process)


async def wait_exit(process):
    """Отслеживает выход лидера независимо от каналов, оставленных потомками."""
    while process.returncode is None:
        await asyncio.sleep(.05)
    return process.returncode


async def run_process_handler(ctx, settings, log):
    """Выполняет одну активацию; отмена возвращается только после завершения ребёнка."""
    child = settings.get("_child_path", str(Path(__file__).with_name("process_child.py")))
    spawning = asyncio.create_task(asyncio.create_subprocess_exec(
        sys.executable, "-u", child, stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        env=child_environment(), limit=FRAME_LIMIT, start_new_session=os.name != "nt"))
    interrupted = False
    while not spawning.done():
        try:
            await asyncio.shield(spawning)
        except asyncio.CancelledError:
            interrupted = True
    process = spawning.result()
    job = None
    events = set()
    pids = {process.pid}
    register_pid(process.pid)

    def ready(pid):
        """Добавляет фактический интерпретатор при наличии системного лаунчера."""
        if pid > 0:
            add_process(job, pid)
            pids.add(pid)
            register_pid(pid)

    values = dict(ctx.env or {})
    values["REDIS_URL"] = settings["redis_url"]
    secrets = [ctx.token] + [str(value) for key, value in values.items()
                            if secret_environment_key(key)]
    readers = [asyncio.create_task(drain(process.stdout, ctx.token_id, log, secrets, events, True, ready)),
               asyncio.create_task(drain(process.stderr, ctx.token_id, log, secrets, events))]
    waiter = asyncio.create_task(wait_exit(process))
    try:
        job = attach_job(process.pid)
        if interrupted:
            raise asyncio.CancelledError
        payload = {"token_id": ctx.token_id, "token": ctx.token,
                   "bot_file": ctx.bot_file, "env": values,
                   "project_id": settings.get("project_id", getattr(ctx, "project_id", 0)),
                   "idle": settings["idle"]}
        process.stdin.write((json.dumps(payload) + "\n").encode())
        await asyncio.wait_for(process.stdin.drain(), 5)
        pending = {waiter, *readers}
        while waiter in pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                task.result()
        # Потомок не должен бессрочно удерживать унаследованный канал журнала.
        await asyncio.wait_for(asyncio.gather(*readers), 1)
        if process.returncode != 0 or not {"ready", "idle"} <= events or "error" in events:
            raise RuntimeError("Обработчик завершился без подтверждения сохранения состояния")
        return "idle"
    finally:
        cleanup = asyncio.create_task(stop_process(process, settings.get("_stop_timeout", 10)))
        while not cleanup.done():
            try:
                await asyncio.shield(cleanup)
            except asyncio.CancelledError:
                continue
        try:
            cleanup.result()
            close_job(job)
        except Exception:
            log(ctx.token_id, "stderr", "ОС не подтвердила остановку обработчика: аварийное завершение воркера")
            os._exit(70)
            raise
        if os.name != "nt":
            with contextlib.suppress(ProcessLookupError):
                os.killpg(process.pid, signal.SIGKILL)
        for pid in pids:
            unregister_pid(pid)
        for task in [*readers, waiter]:
            if not task.done():
                task.cancel()
        await asyncio.gather(*readers, waiter, return_exceptions=True)
        if process.stdin:
            process.stdin.close()
