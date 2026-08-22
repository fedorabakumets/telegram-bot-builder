"""
Bot Worker — asyncio мастер-процесс для запуска нескольких ботов в одном event loop.

Протокол:
  stdin  → {"cmd": "start_bot", "token": "...", "token_id": 42, "bot_file": "/path/to/bot.py"}
  stdin  → {"cmd": "stop_bot", "token_id": 42}
  stdin  → {"cmd": "status"} | {"cmd": "shutdown"}
  stdout ← {"token_id": 42, "type": "stdout"|"stderr", "content": "..."}
  stdout ← {"type": "system", "content": "worker_ready|bot_started:ID|bot_exited:ID:status|..."}
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import sys
import time
import traceback
import types
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import bot_code_cache
import worker_isolation as iso

PROJECT_ID = int(os.environ.get("PROJECT_ID", "0"))

# Локальные модули бота, которые часто конфликтуют по короткому имени
_SIBLING_PRIORITY = ("config", "utils", "redis_storage", "database", "middlewares", "handlers")

# Подсказки для типичных ошибок запуска (зеркало server/bots/formatBotRuntimeError.ts)
_ERROR_HINTS: list[tuple[str, str, str]] = [
    (
        "token is invalid",
        "Неверный токен Telegram-бота",
        "Откройте @BotFather → ваш бот → API Token, скопируйте токен и вставьте в настройки проекта.",
    ),
    (
        "unauthorized",
        "Токен не авторизован",
        "Токен отозван или неверный. Получите новый в @BotFather и обновите в настройках проекта.",
    ),
    (
        "no module named",
        "Не найден модуль Python",
        "Проверьте зависимости бота или пересоберите код проекта.",
    ),
    (
        "syntaxerror",
        "Синтаксическая ошибка в коде бота",
        "Проверьте схему проекта и пересоберите бот.",
    ),
    (
        "indentationerror",
        "Ошибка отступов в коде бота",
        "Проверьте сгенерированный код или пересоберите проект.",
    ),
    (
        "filenotfounderror",
        "Файл бота не найден",
        "Пересоберите бот или проверьте, что проект сохранён.",
    ),
]


def format_bot_error(exc: BaseException) -> str:
    """Форматирует исключение для терминала: заголовок, подсказка, тех. деталь."""
    msg = str(exc).strip()
    first_line = msg.splitlines()[0] if msg else type(exc).__name__
    lower = msg.lower()
    for key, title, hint in _ERROR_HINTS:
        if key in lower:
            return f"{title}\n→ {hint}\n(технически: {first_line})"
    return f"Ошибка запуска: {first_line}"


class WorkerLogHandler(logging.Handler):
    """Root handler: token_id из contextvars (изоляция логов между ботами)."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            tid = iso.current_token_id.get()
            if tid == 0:
                return
            emit_log(tid, msg, "stderr" if record.levelno >= logging.WARNING else "stdout")
        except Exception:
            pass


_root_handler_installed = False


def ensure_root_log_handler() -> None:
    """Ставит один process-level handler без clear() на каждый старт бота."""
    global _root_handler_installed
    if _root_handler_installed:
        return
    root = logging.getLogger()
    # Убираем только дефолтные StreamHandler'ы, не трогая чужие при повторном вызове
    root.handlers.clear()
    root.addHandler(WorkerLogHandler())
    root.setLevel(logging.DEBUG)
    _root_handler_installed = True


def emit_log(token_id: int, content: str, stream: str = "stdout") -> None:
    """Отправляет строку лога в stdout как JSON с timestamp."""
    try:
        ts = datetime.now().strftime("%H:%M:%S")
        line = json.dumps(
            {"token_id": token_id, "type": stream, "content": f"[{ts}] {content}"},
            ensure_ascii=False,
        )
        sys.stdout.write(line + "\n")
        sys.stdout.flush()
    except Exception:
        try:
            line = json.dumps(
                {"token_id": token_id, "type": stream, "content": content},
                ensure_ascii=True,
            )
            sys.stdout.write(line + "\n")
            sys.stdout.flush()
        except Exception:
            pass


def emit_system(content: str) -> None:
    """Системное сообщение воркера (без token_id)."""
    line = json.dumps({"type": "system", "content": content}, ensure_ascii=False)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


class BotContext:
    """Контекст одного бота внутри воркера."""

    def __init__(self, token_id: int, token: str, bot_file: str):
        self.token_id = token_id
        self.token = token
        self.bot_file = bot_file
        self.task: Optional[asyncio.Task] = None
        self.started_at: Optional[datetime] = None
        self.status: str = "starting"
        self.webhook_url: Optional[str] = None
        self.webhook_port: Optional[int] = None
        self.bot_dir: Optional[Path] = None
        # Загруженный module bot.py — для request_bot_stop()
        self.module: Optional[types.ModuleType] = None

    def to_dict(self) -> Dict[str, Any]:
        """Сериализация для команды status."""
        return {
            "token_id": self.token_id,
            "status": self.status,
            "bot_file": self.bot_file,
            "started_at": self.started_at.isoformat() if self.started_at else None,
        }


class BotWorker:
    """Мастер-процесс: N ботов в одном asyncio loop."""

    def __init__(self):
        self.bots: Dict[int, BotContext] = {}
        self._shutdown_event = asyncio.Event()
        ensure_root_log_handler()

    async def handle_command(self, data: Dict[str, Any]) -> None:
        """Обрабатывает одну JSON-команду из stdin."""
        cmd = data.get("cmd")
        if cmd == "start_bot":
            await self._start_bot(data)
        elif cmd == "stop_bot":
            await self._stop_bot(data)
        elif cmd == "status":
            self._emit_status()
        elif cmd == "shutdown":
            await self._shutdown()
        else:
            emit_system(f"unknown_command: {cmd}")

    async def _start_bot(self, data: Dict[str, Any]) -> None:
        """Регистрирует и запускает задачу бота."""
        token_id = data.get("token_id")
        token = data.get("token", "")
        bot_file = data.get("bot_file", "")
        webhook_url = data.get("webhook_url")
        webhook_port = data.get("webhook_port")

        if not token_id or not token or not bot_file:
            emit_log(token_id or 0, "Ошибка: не указаны token_id, token или bot_file", "stderr")
            return

        if token_id in self.bots:
            emit_log(token_id, "Бот уже запущен, перезапускаем...", "stdout")
            await self._stop_bot({"token_id": token_id})
            await asyncio.sleep(2.0)

        ctx = BotContext(token_id=token_id, token=token, bot_file=bot_file)
        ctx.webhook_url = webhook_url
        ctx.webhook_port = webhook_port
        self.bots[token_id] = ctx
        ctx.task = asyncio.create_task(self._run_bot(ctx))
        emit_log(token_id, f"Бот добавлен в воркер (project={PROJECT_ID})", "stdout")

    async def _run_bot(self, ctx: BotContext) -> None:
        """Загружает bot.py в изолированном namespace и вызывает main()."""
        token_id = ctx.token_id
        token_token = iso.current_token_id.set(token_id)
        alias_prev: Dict[str, Any] = {}

        try:
            emit_log(token_id, "─── Начало загрузки бота ───", "stdout")
            bot_path = Path(ctx.bot_file)
            emit_log(token_id, f"Путь к файлу: {bot_path}", "stdout")
            if not bot_path.exists():
                emit_log(token_id, f"Файл не найден: {bot_path}", "stderr")
                ctx.status = "error"
                return

            bot_dir = bot_path.parent
            ctx.bot_dir = bot_dir
            iso.install_bot_package(token_id, bot_dir)

            main_stem = bot_path.stem
            siblings = list(_SIBLING_PRIORITY)
            for stem in iso.list_local_py_stems(bot_dir, exclude={main_stem, *siblings}):
                siblings.append(stem)

            async with iso.get_env_lock():
                env_prev = iso.apply_bot_env(
                    ctx.token, token_id, ctx.webhook_url, ctx.webhook_port
                )
                emit_log(token_id, f"Env: PROJECT_ID={PROJECT_ID}, TOKEN_ID={token_id}", "stdout")

                loaded = iso.load_sibling_modules(token_id, bot_dir, siblings)
                iso.apply_short_aliases(loaded, alias_prev)

                def _bot_log(msg: str) -> None:
                    emit_log(token_id, msg, "stdout")

                compiled = bot_code_cache.load_bot_code(bot_path, _bot_log)

                module = types.ModuleType(f"bot_{token_id}")
                module.__file__ = str(bot_path)
                module.__package__ = f"bot_{token_id}_pkg"

                def patched_print(*args, **kwargs):
                    content = " ".join(str(a) for a in args)
                    emit_log(token_id, content, "stdout")

                module.__builtins__ = {
                    **(__builtins__ if isinstance(__builtins__, dict) else vars(__builtins__))
                }
                module.__builtins__["print"] = patched_print

                emit_log(token_id, "Выполнение top-level кода бота...", "stdout")
                t_exec = time.perf_counter()
                exec(compiled, module.__dict__)
                exec_ms = (time.perf_counter() - t_exec) * 1000
                iso.inject_bot_constants(
                    module, ctx.token, token_id, ctx.webhook_url, ctx.webhook_port
                )
                # Проставляем константы и в загруженные sibling-модули
                for _name, smod in loaded.items():
                    smod.__dict__["BOT_TOKEN"] = ctx.token
                    smod.__dict__["TOKEN_ID"] = token_id
                emit_log(token_id, f"Top-level код выполнен за {exec_ms:.0f} мс", "stdout")
                ctx.module = module

                iso.restore_short_aliases(alias_prev)
                alias_prev = {}
                iso.restore_env(env_prev)

            ctx.status = "running"
            ctx.started_at = datetime.now()
            emit_system(f"bot_started:{token_id}")

            if hasattr(module, "main"):
                emit_log(token_id, "Вызов main()...", "stdout")
                await module.main()
                emit_log(token_id, "main() завершился", "stdout")
                # Старые bot.py глотали CancelledError → статус оставался running
                if ctx.status == "running":
                    ctx.status = "stopped"
            else:
                emit_log(token_id, "Функция main() не найдена в bot.py", "stderr")
                ctx.status = "error"

        except asyncio.CancelledError:
            emit_log(token_id, "Бот остановлен (CancelledError)", "stdout")
            ctx.status = "stopped"
        except Exception as e:
            user_msg = format_bot_error(e)
            tb = traceback.format_exc()
            emit_log(token_id, user_msg, "stderr")
            sys.stderr.write(f"[bot_{token_id}] {user_msg}\n{tb}\n")
            sys.stderr.flush()
            ctx.status = "error"
        finally:
            if alias_prev:
                iso.restore_short_aliases(alias_prev)
            iso.cleanup_bot_modules(token_id, ctx.bot_dir)
            if token_id in self.bots and self.bots[token_id] is ctx:
                del self.bots[token_id]
            emit_system(f"bot_exited:{token_id}:{ctx.status}")
            iso.current_token_id.reset(token_token)

    async def _stop_bot(self, data: Dict[str, Any]) -> None:
        """Останавливает бота: сначала graceful request_bot_stop, затем cancel."""
        token_id = data.get("token_id")
        if not token_id:
            return
        ctx = self.bots.get(token_id)
        if not ctx:
            emit_log(token_id, "Бот не найден в воркере", "stderr")
            return

        # 1) Graceful: ставит _stop_event → main делает stop_polling
        mod = ctx.module
        if mod is not None and hasattr(mod, "request_bot_stop"):
            try:
                mod.request_bot_stop()
                emit_log(token_id, "Graceful stop: request_bot_stop()", "stdout")
            except Exception as e:
                emit_log(token_id, f"request_bot_stop ошибка: {e}", "stderr")

        if ctx.task and not ctx.task.done():
            try:
                await asyncio.wait_for(asyncio.shield(ctx.task), timeout=15.0)
            except asyncio.TimeoutError:
                emit_log(token_id, "Graceful stop timeout 15с — cancel задачи", "stderr")
                ctx.task.cancel()
                try:
                    await asyncio.wait_for(asyncio.shield(ctx.task), timeout=5.0)
                except asyncio.TimeoutError:
                    # Не эмитим bot_stopped пока task жив — иначе UI думает что стоп успешен
                    emit_log(
                        token_id,
                        "Таймаут остановки: задача бота ещё выполняется (orphan)",
                        "stderr",
                    )
                    return
                except asyncio.CancelledError:
                    pass
            except asyncio.CancelledError:
                pass

        ctx.status = "stopped"
        ctx.module = None
        if token_id in self.bots:
            del self.bots[token_id]
        emit_log(token_id, "Бот остановлен", "stdout")
        emit_system(f"bot_stopped:{token_id}")

    def _emit_status(self) -> None:
        """Статус всех ботов."""
        status = {
            "project_id": PROJECT_ID,
            "bots_count": len(self.bots),
            "bots": [ctx.to_dict() for ctx in self.bots.values()],
        }
        line = json.dumps({"type": "status", "data": status}, ensure_ascii=False)
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

    async def _shutdown(self) -> None:
        """Останавливает все боты."""
        emit_system("shutting_down")
        tasks = [self._stop_bot({"token_id": tid}) for tid in list(self.bots.keys())]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        self._shutdown_event.set()

    async def run(self) -> None:
        """Главный цикл: stdin → команды."""
        emit_system("worker_ready")
        loop = asyncio.get_event_loop()
        stdin_queue: asyncio.Queue = asyncio.Queue()

        def _stdin_reader():
            try:
                for line in sys.stdin:
                    loop.call_soon_threadsafe(stdin_queue.put_nowait, line.strip())
            except (EOFError, OSError):
                pass
            finally:
                loop.call_soon_threadsafe(stdin_queue.put_nowait, None)

        import threading

        threading.Thread(target=_stdin_reader, daemon=True).start()

        while not self._shutdown_event.is_set():
            try:
                line_str = await asyncio.wait_for(stdin_queue.get(), timeout=1.0)
                if line_str is None:
                    emit_system("stdin_closed")
                    break
                if not line_str:
                    continue
                try:
                    data = json.loads(line_str)
                    await self.handle_command(data)
                except json.JSONDecodeError as e:
                    emit_system(f"json_error: {e}")
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                emit_system(f"read_error: {e}")
                break

        if self.bots:
            await self._shutdown()
        emit_system("worker_exited")


def main():
    """Точка входа воркера."""
    if sys.platform == "win32":
        sys.stdout = open(sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1, closefd=False)
        sys.stderr = open(sys.stderr.fileno(), mode="w", encoding="utf-8", buffering=1, closefd=False)
        sys.stdin = open(sys.stdin.fileno(), mode="r", encoding="utf-8", closefd=False)
    else:
        sys.stdout.reconfigure(line_buffering=True)

    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    # Один раз на процесс воркера: боты не регистрируют свои signal_handler
    signal.signal = lambda *args, **kwargs: None  # type: ignore[method-assign]

    asyncio.run(BotWorker().run())


if __name__ == "__main__":
    main()
