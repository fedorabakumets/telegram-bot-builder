"""@fileoverview Проверяет удержание пространств ботов после закрытия настоящих локальных пулов."""
import argparse
import ast
import asyncio
import gc
import json
import logging
import os
from pathlib import Path
import uuid
import weakref

import asyncpg


class Marker:
    """Позволяет независимо проверить освобождение пространства одного бота."""
    pass


def generated_code(path):
    """Компилирует настоящие функции из сохранённого результата генератора."""
    source = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    names = {'init_database', '_database_pool_idle_seconds'}
    nodes = [node for node in ast.parse(source).body
             if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names]
    assert {node.name for node in nodes} == names
    return compile(ast.Module(body=nodes, type_ignores=[]), '<generated-database>', 'exec')


def rss_bytes():
    """Измеряет резидентную память только Linux-процесса Python."""
    with open('/proc/self/statm', encoding='ascii') as source:
        return int(source.read().split()[1]) * os.sysconf('SC_PAGE_SIZE')


async def main():
    """Создаёт сто пулов в собственной локальной БД и проверяет их окончательное освобождение."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--label', choices=('before', 'after'), required=True)
    args = parser.parse_args()
    code = generated_code(args.source)
    port = int(os.environ.get('LOCAL_PG_RETENTION_PORT', '55439'))
    admin = await asyncpg.connect(host='127.0.0.1', port=port, user='postgres', database='postgres')
    name = 'tbb_retention_' + uuid.uuid4().hex
    database_url = f'postgresql://postgres@127.0.0.1:{port}/{name}'
    markers = []
    connections = []
    samples = []
    baseline = rss_bytes()
    await admin.execute('CREATE DATABASE "' + name + '"')
    try:
        observer = await asyncpg.connect(host='127.0.0.1', port=port, user='postgres', database=name)
        try:
            await observer.execute('CREATE FUNCTION public.mark_analytics_runtime_v2(integer, integer) RETURNS void LANGUAGE sql AS $$ SELECT $$')
            await observer.execute("CREATE TYPE probe_enum AS ENUM ('one','two')")
            await observer.execute('CREATE TYPE probe_record AS (value integer, kind probe_enum)')
            for cycle in range(1, 101):
                namespace = dict(marker=Marker(), asyncpg=asyncpg, logging=logging, DATABASE_URL=database_url,
                                 PROJECT_ID=77, TOKEN_ID=7, db_pool=None)
                markers.append(weakref.ref(namespace['marker']))
                exec(code, namespace)
                await namespace['init_database']()
                pool = namespace['db_pool']
                assert pool is not None
                assert pool._setup is pool._init
                if args.label == 'after':
                    assert pool._setup.__globals__ == {'__builtins__': {}}
                    assert pool._setup.__closure__ is None
                    assert pool._setup.__defaults__ == ('77', '7')
                acquired = await asyncio.gather(*(pool.acquire() for _ in range(6)))
                for proxy in acquired:
                    connections.append(weakref.ref(proxy._con))
                    scope = await proxy.fetchrow("SELECT current_setting('app.project_id'), current_setting('app.token_id')")
                    assert tuple(scope) == ('77', '7')
                    for query in range(20):
                        row = await proxy.fetchrow(f"SELECT ROW($1::integer, 'one'::probe_enum)::probe_record AS value, $2::jsonb AS data, {query} AS q", cycle, '{"ok":true}')
                        assert row['value']['value'] == cycle
                    assert len(proxy._con._stmt_cache) >= 20
                    await proxy.execute("SELECT set_config('app.token_id', 'wrong', false)")
                del proxy, row
                await asyncio.gather(*(pool.release(proxy) for proxy in acquired))
                del acquired
                async with pool.acquire() as check:
                    assert await check.fetchval("SELECT current_setting('app.token_id')") == '7'
                del check
                if cycle % 10 == 0:
                    entered = asyncio.Event()
                    async def cancelled_query():
                        """Отменяет настоящий запрос и возвращает соединение пулу."""
                        async with pool.acquire() as conn:
                            entered.set()
                            await conn.execute('SELECT pg_sleep(30)')
                    task = asyncio.create_task(cancelled_query())
                    await entered.wait()
                    await asyncio.sleep(0.01)
                    task.cancel()
                    result = await asyncio.gather(task, return_exceptions=True)
                    assert isinstance(result[0], asyncio.CancelledError)
                    del task, result, cancelled_query
                    async with pool.acquire() as check:
                        assert await check.fetchval('SELECT 42') == 42
                    del check
                await pool.close()
                del pool, namespace
                await asyncio.sleep(0)
                if cycle in (1, 10, 50, 100):
                    sessions = await observer.fetchval('SELECT count(*) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', name)
                    assert sessions == 0, (cycle, sessions)
                    samples.append(dict(cycle=cycle, rss_bytes=rss_bytes(), server_sessions=sessions,
                        live_namespaces=sum(ref() is not None for ref in markers),
                        live_pools=sum(isinstance(item, asyncpg.Pool) for item in gc.get_objects()),
                        live_connections=sum(ref() is not None for ref in connections)))
            before_gc = rss_bytes()
            collected = gc.collect()
            await asyncio.sleep(0)
            remaining = dict(namespaces=sum(ref() is not None for ref in markers),
                             pools=sum(isinstance(item, asyncpg.Pool) for item in gc.get_objects()),
                             connections=sum(ref() is not None for ref in connections))
            assert not any(remaining.values()), remaining
            # Только диагностика: удерживаем закрытые пулы, проверяя ссылку через callback.
            pinned = []
            for _ in range(3):
                namespace = dict(marker=Marker(), asyncpg=asyncpg, logging=logging, DATABASE_URL=database_url,
                                 PROJECT_ID=77, TOKEN_ID=7, db_pool=None)
                markers.append(weakref.ref(namespace['marker']))
                exec(code, namespace)
                await namespace['init_database']()
                pool = namespace['db_pool']
                assert pool is not None
                await pool.close()
                pinned.append(pool)
                del pool, namespace
            gc.collect()
            pinned_namespaces = sum(ref() is not None for ref in markers)
            assert pinned_namespaces == (3 if args.label == 'before' else 0), pinned_namespaces
            pinned.clear()
            gc.collect()
            assert not any(ref() is not None for ref in markers)
            print(json.dumps(dict(label=args.label, version=asyncpg.__version__, cycles=100, created_connections=600,
                baseline_rss_bytes=baseline, before_gc_rss_bytes=before_gc, after_gc_rss_bytes=rss_bytes(),
                collected=collected, remaining=remaining, pinned_namespaces=pinned_namespaces, samples=samples)), flush=True)
        finally:
            await observer.close()
    finally:
        unfinished = locals().get('pool')
        if unfinished is not None:
            unfinished.terminate()
        await admin.execute('DROP DATABASE "' + name + '" WITH (FORCE)')
        await admin.close()


if __name__ == '__main__':
    asyncio.run(main())
