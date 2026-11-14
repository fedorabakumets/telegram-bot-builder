"""@fileoverview Лёгкие числовые счётчики памяти без обхода объектов и содержимого данных."""

import json
import sys
import time
import types
import asyncio
import gc
from itertools import islice

MAX_BOTS = 100
MAX_MODULES = 10000
MAX_MODELS = 2048
CONTAINERS = (
    "_user_var_locks", "_code_node_locks", "_bot_tables_cache", "_content_cache",
    "_media_file_id_cache", "_input_timeout_tasks", "_schedule_tasks",
    "_analytics_persistence_tasks", "_api_pending_responses", "_media_download_locks",
    "_media_task_leases", "_media_cache_directories", "_media_path_leases",
    "user_data", "all_user_vars", "_rate_counter_deques", "_user_last_seen",
)


def _container(value):
    """Измеряет только оболочку встроенного контейнера, не читая его элементы."""
    if type(value) not in (dict, list, tuple, set, frozenset):
        return None
    return {"count": len(value), "shallowBytes": sys.getsizeof(value)}


def _bot_row(token_id, ctx, modules):
    """Собирает разрешённые счётчики модулей одного бота без значений и ключей."""
    candidates = [getattr(ctx, "module", None)]
    prefix = f"bot_{token_id}_"
    candidates.extend(module for name, module in modules if name.startswith(prefix))
    seen_modules, seen_values, counters = set(), set(), {}
    pools = {"count": 0, "size": 0, "idle": 0}
    for module in candidates:
        if not isinstance(module, types.ModuleType) or id(module) in seen_modules:
            continue
        seen_modules.add(id(module))
        namespace = vars(module)
        for name in CONTAINERS:
            value = namespace.get(name)
            if id(value) in seen_values:
                continue
            measured = _container(value)
            if measured is not None:
                seen_values.add(id(value))
                row = counters.setdefault(name, {"count": 0, "shallowBytes": 0})
                for key in row:
                    row[key] += measured[key]
        pool = namespace.get("db_pool")
        if pool is not None and id(pool) not in seen_values:
            seen_values.add(id(pool))
            pools["count"] += 1
            # Только известные быстрые методы asyncpg; без подключения к БД.
            if type(pool).__module__ == "asyncpg.pool":
                pools["size"] += pool.get_size()
                pools["idle"] += pool.get_idle_size()
    return {"tokenId": token_id, "moduleCount": len(seen_modules),
            "containers": counters, "pools": pools,
            "rootTaskPending": int(getattr(ctx, "task", None) is not None
                                   and not ctx.task.done())}


def snapshot(bots):
    """Возвращает ограниченный снимок; shallowBytes не является RSS или владением памятью."""
    started = time.monotonic()
    import worker_runtime_model_counters
    import worker_namespace_counters
    diagnostics = worker_runtime_model_counters.snapshot()
    diagnostics.update(worker_namespace_counters.snapshot())
    diagnostics["gcCounts"] = gc.get_count()
    diagnostics["gcCollections"] = [row["collections"] for row in gc.get_stats()]
    try:
        # Снимок раз в десять секунд: O(числа задач), без стека и содержимого coroutine.
        diagnostics["pendingAsyncioTasks"] = len(asyncio.all_tasks())
    except RuntimeError:
        diagnostics["pendingAsyncioTasks"] = None
    modules = list(islice(sys.modules.items(), MAX_MODULES))
    classes, complete = set(), 0
    package = sys.modules.get("aiogram.types")
    if isinstance(package, types.ModuleType):
        for value in islice(vars(package).values(), MAX_MODELS):
            if isinstance(value, type) and value.__module__.startswith("aiogram."):
                if id(value) not in classes:
                    classes.add(id(value))
                    complete += int(vars(value).get("__pydantic_complete__") is True)
    rows = [_bot_row(token_id, ctx, modules)
            for token_id, ctx in islice(bots.items(), MAX_BOTS)]
    return {"type": "worker_runtime_counters", "schemaVersion": 2, **diagnostics,
            "timestamp": time.time(), "scope": "known_module_containers_shallow",
            "botsTotal": len(bots), "botsTruncated": len(bots) > MAX_BOTS,
            "modulesTruncated": len(sys.modules) > MAX_MODULES,
            "exportedAiogramModels": len(classes), "builtExportedAiogramModels": complete,
            "modelScanLimit": MAX_MODELS,
            "modelsTruncated": isinstance(package, types.ModuleType)
            and len(vars(package)) > MAX_MODELS, "bots": rows,
            "durationMs": round((time.monotonic() - started) * 1000, 3)}


def report(bots):
    """Публикует безопасные агрегаты; сбой диагностики не нарушает работу сценариев."""
    try:
        sys.__stdout__.write(json.dumps(snapshot(bots)) + "\n")
        sys.__stdout__.flush()
    except Exception:
        sys.__stderr__.write("[worker-runtime-counters] Снимок недоступен\n")
