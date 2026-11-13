"""@fileoverview Независимые постоянные и временные сценарии в одном интерпретаторе."""

import asyncio

from shared_protocol import SharedProtocol
from shared_session import SharedSession
import worker


class UnifiedProtocol(SharedProtocol):
    """Сохраняет штатные события постоянных ботов и активации временных."""

    def install(self):
        """Устанавливает маршрутизацию без подавления событий постоянных сценариев."""
        original_system = worker.emit_system
        super().install()
        external_system = worker.emit_system

        def system(content):
            """Различает события по зарегистрированному владельцу токена."""
            parts = content.split(":")
            token_id = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
            if token_id in self.active:
                external_system(content)
            else:
                original_system(content)

        worker.emit_system = system


class UnifiedSessions:
    """Запрещает двойную регистрацию токена и очищает ссылки после завершения."""

    def __init__(self, permanent, protocol):
        """Создаёт реестр временных сессий рядом с постоянным воркером."""
        self.permanent = permanent
        self.protocol = protocol
        self.sessions = {}
        self.tasks = {}

    async def execute(self, token_id, session):
        """Завершает только собственную активацию без удаления соседних ботов."""
        try:
            await session.run()
        finally:
            self.sessions.pop(token_id, None)
            self.tasks.pop(token_id, None)
            self.protocol.active.pop(token_id, None)
            self.protocol.timing.pop(token_id, None)

    async def command(self, command):
        """Принимает команды обоих протоколов с проверкой конфликтов токена."""
        action = command.get("cmd")
        token_id = int(command.get("token_id", 0))
        if action == "start_bot":
            if token_id in self.sessions:
                worker.emit_system(f"bot_exited:{token_id}:error")
                return
            await self.permanent.handle_command(command)
        elif action == "start":
            if token_id in self.sessions or token_id in self.permanent.bots:
                self.protocol.event("error", token_id, reason="already_active")
                return
            self.protocol.active[token_id] = command.get("activation_id")
            try:
                session = SharedSession(command, self.protocol)
                self.sessions[token_id] = session
                self.tasks[token_id] = asyncio.create_task(self.execute(token_id, session))
            except Exception:
                self.protocol.event("exited", token_id, code=1, reason="error")
                self.protocol.active.pop(token_id, None)
        elif action == "stop":
            if token_id in self.sessions and command.get("activation_id") == self.protocol.active.get(token_id):
                await self.sessions[token_id].stop()
                task = self.tasks.get(token_id)
                if task is not None:
                    await task
        elif action in ("stop_bot", "status"):
            await self.permanent.handle_command(command)

    async def close(self):
        """Останавливает оба класса сценариев до завершения общего процесса."""
        await asyncio.gather(self.permanent._shutdown(),
                             *(session.stop() for session in list(self.sessions.values())))
        await asyncio.gather(*list(self.tasks.values()), return_exceptions=True)

    def contexts(self):
        """Возвращает объединённый снимок контекстов только для числовой диагностики."""
        return {**self.permanent.bots,
                **{token_id: session.ctx for token_id, session in self.sessions.items()}}
