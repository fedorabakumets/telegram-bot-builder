"""@fileoverview Защита перехода на обычный polling от потери сохранённой очереди."""

from bot_env_overlay import get_base_environ


async def prepare_direct(ctx):
    """Отказывает при backlog; снимок переносится только под polling lease."""
    values = {**get_base_environ(), **(ctx.env or {})}
    address = values.get("REDIS_URL")
    if not address:
        return
    from demand_queue import DemandQueue
    from demand_state import DemandState
    queue = DemandQueue(address, int(ctx.token.split(":", 1)[0]))
    try:
        await queue.open()
        if await queue.peek() is not None:
            raise ValueError("Очередь ondemand не пуста: сначала включите ondemand и обработайте backlog")
        state = DemandState(queue, ctx.project_id, ctx.token_id)
        # Активный владелец ещё может записать снимок; менять его состояние запрещено.
        if await queue.redis.exists(f"bot:lock:{ctx.token[-10:]}"):
            raise ValueError("Другой polling-процесс ещё владеет ботом; повторите запуск после остановки")
        if await queue.redis.exists(state.key):
            from demand_settings import build_markers
            if not build_markers(ctx.bot_file).get("_WORKER_DIRECT_STATE_PROTOCOL"):
                raise ValueError("Для переноса состояния в direct требуется пересборка бота")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Невозможно проверить backlog: запуск direct отменён") from exc
    finally:
        await queue.close()


async def transfer_direct(ctx, module, lease_owned):
    """Восстанавливает снимок только после захвата блокировки самим ботом."""
    values = {**get_base_environ(), **(ctx.env or {})}
    if not values.get("REDIS_URL"):
        return
    if not lease_owned:
        raise RuntimeError("Не получена блокировка: перенос состояния direct запрещён")
    from demand_queue import DemandQueue
    from demand_state import DemandState
    queue = DemandQueue(values["REDIS_URL"], int(ctx.token.split(":", 1)[0]))
    try:
        await queue.open()
        if await queue.peek() is not None:
            raise RuntimeError("Появилась очередь ondemand: запуск direct отменён")
        state = DemandState(queue, ctx.project_id, ctx.token_id)
        await state.load_into(module)
    finally:
        await queue.close()


async def commit_direct(ctx):
    """Удаляет перенесённый снимок только после успешной подготовки polling."""
    values = {**get_base_environ(), **(ctx.env or {})}
    if not values.get("REDIS_URL"):
        return
    from demand_queue import DemandQueue
    from demand_state import DemandState
    queue = DemandQueue(values["REDIS_URL"], int(ctx.token.split(":", 1)[0]))
    try:
        await queue.open()
        await DemandState(queue, ctx.project_id, ctx.token_id).clear()
    finally:
        await queue.close()
