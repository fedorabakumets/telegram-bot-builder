"""@fileoverview Защита перехода на обычный polling от потери сохранённой очереди."""

from bot_env_overlay import get_base_environ


async def prepare_direct(ctx):
    """Проверяет поддержку безопасного переноса очереди и состояния."""
    values = {**get_base_environ(), **(ctx.env or {})}
    address = values.get("REDIS_URL")
    if not address:
        return
    from demand_queue import DemandQueue
    from demand_state import DemandState
    queue = DemandQueue(address, int(ctx.token.split(":", 1)[0]))
    try:
        await queue.open()
        pending = await queue.peek() is not None
        state = DemandState(queue, ctx.project_id, ctx.token_id)
        # Активный владелец ещё может записать снимок; менять его состояние запрещено.
        if await queue.redis.exists(f"bot:lock:{ctx.token[-10:]}"):
            raise ValueError("Другой polling-процесс ещё владеет ботом; повторите запуск после остановки")
        saved = await queue.redis.exists(state.key)
        if pending or saved:
            from demand_settings import build_markers
            markers = build_markers(ctx.bot_file)
            if not markers.get("_WORKER_DIRECT_STATE_PROTOCOL"):
                raise ValueError("Для переноса состояния в direct требуется пересборка бота")
            if not markers.get("_WORKER_DIRECT_DRAIN_PROTOCOL"):
                raise ValueError("Для обработки очереди ondemand в direct требуется пересборка бота")
            if getattr(ctx, "webhook_url", None):
                raise ValueError("Для переноса очереди ondemand сначала выберите polling вместо webhook")
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
        # Запоминаем владельца, чтобы остановить обработку при потере lease.
        ctx._direct_lease_owner = lease_owned
        if await queue.redis.get(f"bot:lock:{ctx.token[-10:]}") != lease_owned:
            raise RuntimeError("Потеряна блокировка: перенос состояния direct запрещён")
        if await queue.peek() is not None and not getattr(module, "_WORKER_DIRECT_DRAIN_PROTOCOL", False):
            raise RuntimeError("Пересоберите бота для обработки очереди ondemand")
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
        # Проверка владельца, пустоты очереди и удаление снимка неделимы.
        script = """
        if redis.call('GET', KEYS[1]) ~= ARGV[1] then return -1 end
        if redis.call('ZCARD', KEYS[2]) ~= 0 then return -2 end
        redis.call('DEL', KEYS[3])
        return 1
        """
        state = DemandState(queue, ctx.project_id, ctx.token_id)
        result = await queue.redis.eval(script, 3, f"bot:lock:{ctx.token[-10:]}",
            queue.keys[0], state.key, getattr(ctx, "_direct_lease_owner", ""))
        if result != 1:
            raise RuntimeError("Изменились очередь или владелец перед подтверждением direct")
    finally:
        await queue.close()
