"""
Bot Worker — asyncio мастер-процесс для запуска нескольких ботов в одном event loop.

Принимает JSON-команды через stdin, управляет ботами внутри одного процесса.
Каждый бот изолирован: свой Dispatcher, свои переменные, свой namespace.

Протокол:
  stdin  → {"cmd": "start_bot", "token": "...", "token_id": 42, "bot_file": "/path/to/bot.py"}
  stdin  → {"cmd": "stop_bot", "token_id": 42}
  stdin  → {"cmd": "status"}
  stdin  → {"cmd": "shutdown"}
  stdout ← {"token_id": 42, "type": "stdout", "content": "..."}
  stdout ← {"type": "system", "content": "worker_ready"}
"""

import asyncio
import importlib.util
import json
import logging
import os
import signal
import sys
import traceback
import types
from datetime import datetime
from typing import Any, Dict, Optional

# ─── Конфигурация ────────────────────────────────────────────────────────────

PROJECT_ID = int(os.environ.get("PROJECT_ID", "0"))

# ─── Логирование ─────────────────────────────────────────────────────────────


class WorkerLogHandler(logging.Handler):
    """Перенаправляет логи Python в stdout как JSON с token_id."""

    def __init__(self, token_id: int = 0):
        super().__init__()
        self.token_id = token_id

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            emit_log(self.token_id, msg, "stderr" if record.levelno >= logging.WARNING else "stdout")
        except Exception:
            pass


def emit_log(token_id: int, content: str, stream: str = "stdout") -> None:
    """Отправляет строку лога в stdout как JSON."""
    line = json.dumps({"token_id": token_id, "type": stream, "content": content}, ensure_ascii=False)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def emit_system(content: str) -> None:
    """Отправляет системное сообщение воркера."""
    line = json.dumps({"type": "system", "content": content}, ensure_ascii=False)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


# ─── Контекст бота ───────────────────────────────────────────────────────────


class BotContext:
    """Контекст одного бота внутри воркера."""

    def __init__(self, token_id: int, token: str, bot_file: str):
        self.token_id = token_id
        self.token = token
        self.bot_file = bot_file
        self.task: Optional[asyncio.Task] = None
        self.started_at: Optional[datetime] = None
        self.status: str = "starting"

    def to_dict(self) -> Dict[str, Any]:
        """Сериализация для команды status."""
        return {
            "token_id": self.token_id,
            "status": self.status,
            "bot_file": self.bot_file,
            "started_at": self.started_at.isoformat() if self.started_at else None,
        }


# ─── Воркер ──────────────────────────────────────────────────────────────────


class BotWorker:
    """Мастер-процесс, управляющий несколькими ботами в одном event loop."""

    def __init__(self):
        self.bots: Dict[int, BotContext] = {}
        self._shutdown_event = asyncio.Event()

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
        """Запускает бота в event loop."""
        token_id = data.get("token_id")
        token = data.get("token", "")
        bot_file = data.get("bot_file", "")

        if not token_id or not token or not bot_file:
            emit_log(token_id or 0, "Ошибка: не указаны token_id, token или bot_file", "stderr")
            return

        # Если бот уже запущен — сначала останавливаем
        if token_id in self.bots:
            emit_log(token_id, "Бот уже запущен, перезапускаем...", "stdout")
            await self._stop_bot({"token_id": token_id})
            await asyncio.sleep(0.5)

        ctx = BotContext(token_id=token_id, token=token, bot_file=bot_file)
        self.bots[token_id] = ctx

        # Запускаем бота как asyncio Task
        ctx.task = asyncio.create_task(self._run_bot(ctx))
        emit_log(token_id, f"Бот добавлен в воркер (project={PROJECT_ID})", "stdout")

    async def _run_bot(self, ctx: BotContext) -> None:
        """Загружает и запускает bot.py в изолированном контексте."""
        token_id = ctx.token_id

        try:
            # Динамическая загрузка модуля бота
            from pathlib import Path
            bot_path = Path(ctx.bot_file)
            
            emit_log(token_id, f"Загрузка файла: {bot_path}", "stdout")
            emit_log(token_id, f"Файл существует: {bot_path.exists()}", "stdout")
            
            if not bot_path.exists():
                emit_log(token_id, f"Файл не найден: {bot_path}", "stderr")
                ctx.status = "error"
                return

            # Читаем и компилируем код напрямую (обходим проблемы importlib с кириллицей)
            source_code = bot_path.read_text(encoding="utf-8")
            compiled = compile(source_code, str(bot_path), "exec")
            
            module = types.ModuleType(f"bot_{token_id}")
            module.__file__ = str(bot_path)
            module.__loader__ = None

            # Подменяем переменные окружения для этого бота
            os.environ["BOT_TOKEN"] = ctx.token
            os.environ["TOKEN_ID"] = str(token_id)

            # Перехватываем print для маршрутизации логов
            original_print = __builtins__["print"] if isinstance(__builtins__, dict) else getattr(__builtins__, "print")

            def patched_print(*args, **kwargs):
                content = " ".join(str(a) for a in args)
                emit_log(token_id, content, "stdout")

            module.__builtins__ = {**(__builtins__ if isinstance(__builtins__, dict) else vars(__builtins__))}
            module.__builtins__["print"] = patched_print

            # Настраиваем логирование для этого бота
            bot_logger = logging.getLogger(f"bot_{token_id}")
            bot_logger.handlers.clear()
            bot_logger.addHandler(WorkerLogHandler(token_id))
            bot_logger.setLevel(logging.INFO)

            # Загружаем модуль (выполняет top-level код: создание bot, dp, хендлеров)
            exec(compiled, module.__dict__)

            ctx.status = "running"
            ctx.started_at = datetime.now()

            # Вызываем main() бота
            if hasattr(module, "main"):
                await module.main()
            else:
                emit_log(token_id, "Функция main() не найдена в bot.py", "stderr")
                ctx.status = "error"

        except asyncio.CancelledError:
            emit_log(token_id, "Бот остановлен", "stdout")
            ctx.status = "stopped"
        except Exception as e:
            tb = traceback.format_exc()
            emit_log(token_id, f"Ошибка бота: {e}\n{tb}", "stderr")
            ctx.status = "error"
        finally:
            # Убираем бота из активных если он ещё там
            if token_id in self.bots and self.bots[token_id] is ctx:
                del self.bots[token_id]

            # Уведомляем Node.js что бот завершился
            emit_system(f"bot_exited:{token_id}:{ctx.status}")

    async def _stop_bot(self, data: Dict[str, Any]) -> None:
        """Останавливает конкретного бота."""
        token_id = data.get("token_id")
        if not token_id:
            return

        ctx = self.bots.get(token_id)
        if not ctx:
            emit_log(token_id, "Бот не найден в воркере", "stderr")
            return

        if ctx.task and not ctx.task.done():
            ctx.task.cancel()
            try:
                await asyncio.wait_for(ctx.task, timeout=5.0)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass

        ctx.status = "stopped"
        if token_id in self.bots:
            del self.bots[token_id]

        emit_log(token_id, "Бот остановлен", "stdout")
        emit_system(f"bot_stopped:{token_id}")

    def _emit_status(self) -> None:
        """Отправляет статус всех ботов."""
        status = {
            "project_id": PROJECT_ID,
            "bots_count": len(self.bots),
            "bots": [ctx.to_dict() for ctx in self.bots.values()],
        }
        line = json.dumps({"type": "status", "data": status}, ensure_ascii=False)
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

    async def _shutdown(self) -> None:
        """Останавливает все боты и завершает воркер."""
        emit_system("shutting_down")

        # Останавливаем все боты
        tasks = []
        for token_id in list(self.bots.keys()):
            tasks.append(self._stop_bot({"token_id": token_id}))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        self._shutdown_event.set()

    async def run(self) -> None:
        """Главный цикл воркера: читает stdin, обрабатывает команды."""
        emit_system("worker_ready")

        # Читаем stdin в отдельном потоке (Windows не поддерживает asyncio read_pipe для stdin)
        loop = asyncio.get_event_loop()
        stdin_queue: asyncio.Queue = asyncio.Queue()

        def _stdin_reader():
            """Читает stdin в блокирующем режиме из отдельного потока."""
            try:
                for line in sys.stdin:
                    loop.call_soon_threadsafe(stdin_queue.put_nowait, line.strip())
            except (EOFError, OSError):
                pass
            finally:
                loop.call_soon_threadsafe(stdin_queue.put_nowait, None)

        import threading
        reader_thread = threading.Thread(target=_stdin_reader, daemon=True)
        reader_thread.start()

        while not self._shutdown_event.is_set():
            try:
                line_str = await asyncio.wait_for(stdin_queue.get(), timeout=1.0)

                if line_str is None:
                    # stdin закрыт — Node.js процесс завершился
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
                # Нет данных — продолжаем цикл (проверяем shutdown_event)
                continue
            except Exception as e:
                emit_system(f"read_error: {e}")
                break

        # Финальная очистка
        if self.bots:
            await self._shutdown()

        emit_system("worker_exited")


# ─── Точка входа ─────────────────────────────────────────────────────────────


def main():
    """Запуск воркера."""
    # Отключаем буферизацию stdout
    sys.stdout.reconfigure(line_buffering=True)

    # Игнорируем SIGTERM/SIGINT — управление через stdin команду shutdown
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    signal.signal(signal.SIGINT, signal.SIG_IGN)

    worker = BotWorker()
    asyncio.run(worker.run())


if __name__ == "__main__":
    main()
