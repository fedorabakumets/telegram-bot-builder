"""@fileoverview Учёт дочерних задач обновления перед сохранением состояния и сном."""

import asyncio
import contextvars
import time
from contextlib import asynccontextmanager


_scope = contextvars.ContextVar("demand_update_tasks", default=None)


class UpdateTasksError(RuntimeError):
    """Фоновая операция не завершилась успешно; подтверждать обновление нельзя."""


class FatalTaskCleanupError(UpdateTasksError):
    """Живая операция проигнорировала отмену; процесс должен аварийно завершиться."""


def _install_factory(loop):
    """Один раз дополняет фабрику цикла, сохраняя предыдущую фабрику и контекст."""
    previous = loop.get_task_factory()
    if getattr(previous, "_demand_tracking", False):
        return

    def factory(event_loop, coro, **kwargs):
        """Передаёт параметры Python текущей фабрике и учитывает только свой контекст."""
        context = kwargs.get("context")
        owner = context.get(_scope) if context is not None else _scope.get()
        task = (previous(event_loop, coro, **kwargs) if previous else
                asyncio.Task(coro, loop=event_loop, **kwargs))
        if owner is not None and not owner.closed:
            owner.tasks.add(task)
        return task

    factory._demand_tracking = True
    loop.set_task_factory(factory)


class _UpdateTasks:
    """Держит ссылки на дочерние задачи, включая порождённые ими продолжения."""

    def __init__(self, timeout, cleanup_timeout):
        """Ограничивает ожидание работы и отдельное ожидание отмены."""
        self.tasks = set()
        self.closed = False
        self.timeout = timeout
        self.cleanup_timeout = cleanup_timeout

    async def finish(self):
        """Ждёт дерево задач и не скрывает исключения завершённых операций."""
        deadline = time.monotonic() + self.timeout
        failed = False
        while self.tasks:
            batch = set(self.tasks)
            done, pending = await asyncio.wait(batch, timeout=max(0, deadline - time.monotonic()))
            for task in done:
                self.tasks.discard(task)
                if not task.cancelled() and task.exception() is not None:
                    failed = True
            if pending:
                raise UpdateTasksError("Истекло время ожидания фоновых операций обновления")
        if failed:
            raise UpdateTasksError("Фоновая операция обновления завершилась ошибкой")

    async def cancel(self):
        """Отменяет дерево и ждёт очистку без бесконечного зависания воркера."""
        deadline = time.monotonic() + self.cleanup_timeout
        while self.tasks:
            batch = set(self.tasks)
            for task in batch:
                if not task.done():
                    task.cancel()
            done, pending = await asyncio.wait(batch, timeout=max(0, deadline - time.monotonic()))
            for task in done:
                self.tasks.discard(task)
                if not task.cancelled():
                    task.exception()
            if pending:
                raise FatalTaskCleanupError("Фоновая операция не подтвердила отмену")


@asynccontextmanager
async def update_tasks(timeout=30, cleanup_timeout=5):
    """Ожидает дочерние операции до ACK; при ошибке отменяет их и запрещает ACK."""
    if timeout <= 0 or cleanup_timeout <= 0:
        raise ValueError("Таймауты фоновых операций должны быть положительными")
    _install_factory(asyncio.get_running_loop())
    owner = _UpdateTasks(timeout, cleanup_timeout)
    marker = _scope.set(owner)
    try:
        yield
        await owner.finish()
    except BaseException:
        try:
            await owner.cancel()
        except asyncio.CancelledError:
            raise FatalTaskCleanupError("Очистка фоновых операций прервана повторной отменой") from None
        raise
    finally:
        owner.closed = True
        _scope.reset(marker)
