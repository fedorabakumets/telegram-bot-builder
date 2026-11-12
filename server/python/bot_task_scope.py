"""@fileoverview Изолированная отмена дерева задач сценария перед удалением его окружения."""

import asyncio
import contextvars
import time
import weakref

from demand_tasks import FatalTaskCleanupError


_scope = contextvars.ContextVar("bot_lifecycle_tasks", default=None)
_installed = weakref.WeakSet()


def _install_factory(loop):
    """Дополняет фабрику один раз на цикл, сохраняя учёт задач обновления."""
    if loop in _installed:
        return
    previous = loop.get_task_factory()

    def factory(event_loop, coro, **kwargs):
        """Учитывает задачи только своего контекста, включая явно переданный контекст."""
        context = kwargs.get("context")
        owner = context.get(_scope) if context is not None else _scope.get()
        task = (previous(event_loop, coro, **kwargs) if previous else
                asyncio.Task(coro, loop=event_loop, **kwargs))
        if owner is not None:
            owner.tasks.add(task)
            task.add_done_callback(owner.discard)
            if owner.closed:
                task.cancel()
        return task

    # Не заставляем update_tasks повторно оборачивать уже установленную фабрику.
    factory._demand_tracking = getattr(previous, "_demand_tracking", False)
    loop.set_task_factory(factory)
    _installed.add(loop)


class BotTaskScope:
    """Хранит только задачи конкретной активации бота, не затрагивая соседей."""

    def __init__(self, cleanup_timeout=5):
        """Задаёт общий срок отмены дерева, включая задачи из обработчиков отмены."""
        if cleanup_timeout <= 0:
            raise ValueError("Таймаут очистки должен быть положительным")
        self.tasks = set()
        self.cleanup_timeout = cleanup_timeout
        self.marker = None
        self.closed = False

    def enter(self):
        """Связывает создаваемые сценарием задачи с текущей активацией."""
        _install_factory(asyncio.get_running_loop())
        self.marker = _scope.set(self)

    def discard(self, task):
        """Освобождает завершённые задачи и извлекает их исключения."""
        self.tasks.discard(task)
        if not task.cancelled():
            task.exception()

    async def close(self):
        """Отменяет дочерние задачи до очистки модулей; зависание нарушает изоляцию."""
        deadline = time.monotonic() + self.cleanup_timeout
        try:
            while self.tasks:
                batch = set(self.tasks)
                for task in batch:
                    if not task.done():
                        task.cancel()
                _, pending = await asyncio.wait(batch, timeout=max(0, deadline - time.monotonic()))
                for task in batch - pending:
                    self.discard(task)
                if pending or (self.tasks and time.monotonic() >= deadline):
                    raise FatalTaskCleanupError("Дочерние задачи сценария не подтвердили отмену")
        except asyncio.CancelledError:
            raise FatalTaskCleanupError("Очистка задач сценария прервана повторной отменой") from None
        finally:
            # Скопированный старый контекст не должен оживить уже выгруженный сценарий.
            self.closed = True
            _scope.reset(self.marker)
