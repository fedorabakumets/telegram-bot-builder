"""@fileoverview Жизненный цикл сценария в общем процессе без собственного polling."""

import asyncio
import contextlib
import os

from process_child_feed import ProcessChildFeed
from worker import BotContext, BotWorker


class SharedSession:
    """Сохраняет очередь и состояние одного бота до выгрузки его модуля."""

    def __init__(self, init, protocol):
        """Проверяет настройки и создаёт независимые контекст и очередь."""
        self.ctx = BotContext(int(init["token_id"]), init["token"], init["bot_file"])
        self.ctx.env = dict(init.get("env") or {})
        self.ctx.project_id = int(init.get("project_id", 0))
        idle = float(init["idle"])
        if not 0.1 <= idle <= 86400:
            raise ValueError("Недопустимый таймер простоя")
        self.adapter = ProcessChildFeed(self.ctx, self.ctx.env["REDIS_URL"], idle)
        self.protocol = protocol
        self.task = None

    async def run(self):
        """Открывает Redis, выполняет сценарий и освобождает его ресурсы."""
        code, reason = 0, "stop"
        try:
            await self.adapter.queue.open()
            self.task = asyncio.create_task(BotWorker()._run_bot(self.ctx, self.adapter))
            await self.task
            if self.ctx.status == "error":
                code, reason = 1, "error"
            elif self.adapter.idled:
                reason = "idle"
        except Exception:
            code, reason = 1, "error"
        finally:
            await self.adapter.queue.close()
            self.protocol.event("exited", self.ctx.token_id, code=code, reason=reason)

    async def stop(self):
        """Просит сценарий сохранить состояние до завершения его активации."""
        self.adapter.stopping.set()
        hook = getattr(self.ctx.module, "request_bot_stop", None)
        if callable(hook):
            hook()
        if self.task and not self.task.done():
            _, pending = await asyncio.wait((self.task,), timeout=5)
            if pending:
                self.task.cancel()
                _, pending = await asyncio.wait((self.task,), timeout=2)
                if pending:
                    os._exit(70)
