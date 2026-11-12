/** @fileoverview Фазовая проверка памяти Bot Tables: совместимость значений и единственное обновление кеша. */
import { execFileSync } from 'node:child_process';
import { renderPartialTemplate } from '../templates/template-renderer';

const template = renderPartialTemplate('utils/bot-tables-cache.py.jinja2', {});
const program = `import asyncio, logging, json, time
_bot_tables_cache = None
_bot_tables_cache_ts = 0
_bot_tables_cache_lock = asyncio.Lock()
PROJECT_ID = 1
${template}
class Pool:
    """Подставляет строки БД и считает запросы без внешних подключений."""
    calls = 0
    fail = False
    rows = None
    def acquire(self):
        return self
    async def __aenter__(self):
        return self
    async def __aexit__(self, *args):
        return False
    async def fetch(self, sql, project):
        self.calls += 1
        await asyncio.sleep(0)
        if self.fail:
            raise RuntimeError("недоступна")
        if "AS col_id" in sql:
            return [dict(table_id=1, col_name="x", col_id=1), dict(table_id=1, col_name="y", col_id=2), dict(table_id=2, col_name="z", col_id=3)]
        if self.rows is not None:
            return self.rows
        return [dict(table_id=1, table_name="same", row_index=0, data='{"1":0,"2":"ok"}'), dict(table_id=2, table_name="same", row_index=0, data={"3":False})]
db_pool = Pool()
async def main():
    """Проверяет конкурентность, срок кеша, повтор после ошибки и прежнее объединение."""
    global _bot_tables_cache_ts
    await asyncio.gather(*[_refresh_bot_tables_cache() for _ in range(50)])
    assert db_pool.calls == 2, db_pool.calls
    assert _bot_tables_cache == {"table.same":[{"x":"", "y":"ok", "z":""}], "table.same.x":"", "table.same.y":"ok", "table.same.z":""}, _bot_tables_cache
    await _refresh_bot_tables_cache()
    assert db_pool.calls == 2
    _bot_tables_cache_ts = time.monotonic() - 61
    await _refresh_bot_tables_cache()
    assert db_pool.calls == 4
    db_pool.rows = [dict(table_id=1, table_name="multi", row_index=2, data="bad-json"), dict(table_id=1, table_name="multi", row_index=0, data={"1":"first"})]
    _bot_tables_cache_ts = time.monotonic() - 61
    await _refresh_bot_tables_cache()
    assert _bot_tables_cache == {"table.multi":[{"x":"first", "y":""}, {"x":"", "y":""}]}
    db_pool.rows = []
    _bot_tables_cache_ts = time.monotonic() - 61
    await _refresh_bot_tables_cache()
    assert _bot_tables_cache == {}
    db_pool.fail = True
    _bot_tables_cache_ts = time.monotonic() - 61
    await asyncio.gather(*[_refresh_bot_tables_cache() for _ in range(50)])
    assert db_pool.calls == 9
    assert _bot_tables_cache == {}
asyncio.run(main())
print("Bot Tables: совместимость, TTL, 50 конкурентов и сбой БД — OK")
`;
console.log(execFileSync(process.env.PYTHON || 'python', ['-c', program], { encoding: 'utf8' }));
