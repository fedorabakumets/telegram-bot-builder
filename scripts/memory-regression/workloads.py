"""@fileoverview Структурные проверки памяти на реальных шаблонах с синтетическими данными."""
import asyncio
import json
import logging
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def fragment(path):
    """Удаляет только служебный Jinja-комментарий из самостоятельного Python-фрагмента."""
    source = (ROOT / path).read_text(encoding="utf-8")
    return source.split("#}", 1)[1] if source.startswith("{#") else source


async def locks():
    """Проверяет 10000 различных пользователей без удержания завершённых блокировок."""
    scope = {"asyncio": asyncio}
    exec(fragment("lib/templates/utils/scoped-locks.py.jinja2"), scope)
    registry = {}
    for user_id in range(10000):
        async with scope["_scoped_user_lock"](registry, user_id):
            assert len(registry) == 1
    assert not registry
    return {"users": 10000, "retainedKeys": len(registry)}


async def tables():
    """Проверяет два SQL-чтения и один JSON-разбор строки независимо от числа колонок."""
    class Connection:
        """Локальная имитация двух результатов PostgreSQL без сетевого доступа."""
        calls = 0

        async def fetch(self, sql, project):
            """Возвращает синтетические колонки либо JSON-строки таблицы."""
            self.calls += 1
            if "btc.name AS col_name" in sql:
                return [{"table_id": 1, "col_name": f"c{i}", "col_id": i} for i in range(20)]
            return [{"table_id": 1, "table_name": "sample", "row_index": i,
                     "data": json.dumps({str(k): i + k for k in range(20)})} for i in range(1000)]

    conn = Connection()

    class Lease:
        """Предоставляет локальное соединение через штатный контекстный протокол."""
        async def __aenter__(self):
            """Возвращает имитацию соединения."""
            return conn

        async def __aexit__(self, *args):
            """Завершает локальную аренду без внешних ресурсов."""
            return False

    class Pool:
        """Выдаёт контекст аренды, не создавая настоящего пула."""
        def acquire(self):
            """Возвращает локальную аренду."""
            return Lease()

    scope = {"db_pool": Pool(), "PROJECT_ID": 1, "logging": logging,
             "_bot_tables_cache": None, "_bot_tables_cache_ts": 0,
             "_bot_tables_cache_lock": asyncio.Lock()}
    exec(fragment("lib/templates/utils/bot-tables-cache.py.jinja2"), scope)
    original = json.loads
    decoded = 0

    def count_decode(*args, **kwargs):
        """Считает разборы данных, сохраняя исходную реализацию JSON."""
        nonlocal decoded
        decoded += 1
        return original(*args, **kwargs)

    json.loads = count_decode
    try:
        await asyncio.gather(*(scope["_refresh_bot_tables_cache"]() for _ in range(20)))
    finally:
        json.loads = original
    assert conn.calls == 2, conn.calls
    assert decoded == 1000, decoded
    assert len(scope["_bot_tables_cache"]["table.sample"]) == 1000
    return {"rows": 1000, "columns": 20, "parallelReads": 20,
            "sqlQueries": conn.calls, "jsonDecodes": decoded, "previousJoinDecodes": 20000}


async def run():
    """Выполняет ограниченные по объёму нагрузки на настоящий код шаблонов."""
    return {"locks": await locks(), "tables": await tables(), "rateKeys": rate_keys()}


def rate_keys():
    """Проверяет ограниченный обход и удаление 10000 полностью истёкших ключей."""
    source = fragment("lib/templates/rate-counter/rate-counter.py.jinja2")
    scope = {"deque": deque, "_rate_counter_deques": {}}
    exec(source.split("# Обработчики узлов rate_counter", 1)[0], scope)
    for key in range(10000):
        scope["_rate_counter_deques"][key] = deque([100.0])
        scope["_rate_counter_windows"][key] = 60.0
        scope["_rate_counter_cleanup_keys"].append(key)
    scope["_cleanup_rate_counter_keys"](160.0)
    assert len(scope["_rate_counter_deques"]) == 10000
    scope["_cleanup_rate_counter_keys"](161.0)
    assert len(scope["_rate_counter_deques"]) == 9968
    for _ in range(313):
        scope["_cleanup_rate_counter_keys"](161.0)
    assert not scope["_rate_counter_deques"]
    assert not scope["_rate_counter_windows"]
    assert not scope["_rate_counter_cleanup_keys"]
    return {"expiredKeys": 10000, "maxVisitedPerCall": 32, "retainedKeys": 0}


if __name__ == "__main__":
    print(json.dumps(asyncio.run(run())))
