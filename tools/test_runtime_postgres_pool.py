"""@fileoverview Проверяет настоящий локальный PostgreSQL и Redis в отдельной временной БД."""
import ast
import asyncio
import json
import logging
import os
from pathlib import Path
import subprocess
import uuid
from urllib.parse import urlsplit, urlunsplit

import asyncpg
from redis.asyncio import Redis


ROOT = Path(__file__).resolve().parents[1]


def local_urls():
    """Читает только локальные адреса, запрещая подключение к удалённым сервисам."""
    values = {}
    path = ROOT / '.env'
    for line in (path.read_text(encoding='utf-8-sig') if path.exists() else '').splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    urls = [os.environ.get('LOCAL_DATABASE_TEST_URL') or values['DATABASE_URL'],
            os.environ.get('LOCAL_REDIS_TEST_URL') or values.get('REDIS_URL', 'redis://127.0.0.1:6379')]
    for url in urls:
        if urlsplit(url).hostname not in ('localhost', '127.0.0.1', '::1'):
            raise RuntimeError('Разрешены только настоящие локальные сервисы')
    return urls


def generated_init():
    """Получает реальную функцию инициализации из штатного генератора."""
    script = "import {generateDatabase} from './lib/templates/database/database.renderer'; console.log(JSON.stringify(generateDatabase({userDatabaseEnabled:true,botRuntimeRole:true})))"
    result = subprocess.run(['node', 'node_modules/tsx/dist/cli.mjs', '--eval', script],
                            cwd=ROOT, capture_output=True, text=True, encoding='utf-8', timeout=20)
    if result.returncode:
        raise RuntimeError('Генератор тестового пула завершился с ошибкой: ' + result.stderr[-4000:])
    tree = ast.parse(json.loads(result.stdout))
    functions = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                 and node.name in ('init_database', '_database_pool_idle_seconds')]
    assert {node.name for node in functions} == {'init_database', '_database_pool_idle_seconds'}
    return compile(ast.fix_missing_locations(ast.Module(body=functions, type_ignores=[])), '<generated-init>', 'exec')


async def main():
    """Проверяет расширение, сжатие, изоляцию, отмену и закрытие настоящих ресурсов."""
    database_url, redis_url = local_urls()
    parts = urlsplit(database_url)
    admin_url = urlunsplit(parts._replace(path='/postgres'))
    name = 'tbb_pool_probe_' + uuid.uuid4().hex
    isolated_url = urlunsplit(parts._replace(path='/' + name))
    admin = await asyncpg.connect(admin_url)
    redis = Redis.from_url(redis_url, client_name=name)
    namespaces = []
    created = False
    previous = os.environ.get('BOT_DB_POOL_IDLE_SECONDS')
    try:
        await admin.execute('CREATE DATABASE "' + name + '"')
        created = True
        setup = await asyncpg.connect(isolated_url)
        try:
            await setup.execute('CREATE FUNCTION public.mark_analytics_runtime_v2(integer, integer) RETURNS void LANGUAGE sql AS $$ SELECT $$')
        finally:
            await setup.close()
        os.environ['BOT_DB_POOL_IDLE_SECONDS'] = '0.5'
        code = generated_init()
        await redis.ping()
        for token in (1, 2):
            namespace = dict(asyncpg=asyncpg, asyncio=asyncio, os=os, logging=logging,
                             db_pool=None, DATABASE_URL=isolated_url, PROJECT_ID=76 + token, TOKEN_ID=token)
            exec(code, namespace)
            await namespace['init_database']()
            assert namespace['db_pool'] is not None, 'Инициализация не создала пул'
            namespaces.append(namespace)
        observer = await asyncpg.connect(isolated_url)
        async def count():
            """Считает серверные сессии только своей временной базы без наблюдателя."""
            return await observer.fetchval('SELECT count(*) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', name)
        async def burst(namespace):
            """Одновременно держит шесть настоящих соединений и проверяет область бота."""
            pool = namespace['db_pool']
            connections = await asyncio.gather(*(pool.acquire() for _ in range(6)))
            try:
                scopes = await asyncio.gather(*(connection.fetchrow("SELECT current_setting('app.project_id'),current_setting('app.token_id')") for connection in connections))
                expected = (str(namespace['PROJECT_ID']), str(namespace['TOKEN_ID']))
                assert all(tuple(scope) == expected for scope in scopes)
                assert pool.get_size() == 6
            finally:
                await asyncio.gather(*(pool.release(connection) for connection in connections))
            assert pool.get_idle_size() == 6
        try:
            await asyncio.gather(*(burst(namespace) for namespace in namespaces))
            expanded = await count()
            assert expanded == 12, expanded
            for _ in range(100):
                shrunk = await count()
                if shrunk <= 2:
                    break
                await asyncio.sleep(0.05)
            assert shrunk <= 2, shrunk
            await asyncio.gather(*(burst(namespace) for namespace in namespaces))
            pool = namespaces[0]['db_pool']
            async def cancelled_query():
                """Отменяет выполняющийся запрос с возвратом соединения владельцу."""
                async with pool.acquire() as connection:
                    await connection.execute('SELECT pg_sleep(30)')
            task = asyncio.create_task(cancelled_query())
            await asyncio.sleep(0.1)
            task.cancel()
            result = await asyncio.gather(task, return_exceptions=True)
            assert isinstance(result[0], asyncio.CancelledError)
            async with pool.acquire() as connection:
                assert await connection.fetchval('SELECT 42') == 42
            key = name + ':scope'
            await redis.set(key, '77:1', ex=30)
            assert await redis.get(key) == b'77:1'
            await redis.delete(key)
            await asyncio.gather(*(namespace['db_pool'].close() for namespace in namespaces))
            remaining = await count()
            assert remaining == 0, remaining
            await observer.execute('CREATE OR REPLACE FUNCTION public.mark_analytics_runtime_v2(integer, integer) RETURNS void LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(30); END $$')
            cancelled = dict(asyncpg=asyncpg, asyncio=asyncio, os=os, logging=logging,
                             db_pool=None, DATABASE_URL=isolated_url, PROJECT_ID=77, TOKEN_ID=3)
            exec(code, cancelled)
            namespaces.append(cancelled)
            initializing = asyncio.create_task(cancelled['init_database']())
            for _ in range(100):
                waiting = await observer.fetchval("SELECT count(*) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid() AND wait_event='PgSleep'", name)
                if waiting:
                    break
                await asyncio.sleep(0.02)
            assert waiting, 'Инициализация не дошла до серверного ожидания'
            initializing.cancel()
            cancelled_result = await asyncio.gather(initializing, return_exceptions=True)
            assert isinstance(cancelled_result[0], asyncio.CancelledError)
            assert cancelled['db_pool'] is None
            assert await count() == 0
            print(json.dumps(dict(status='passed', generatedInit=True, postgresReal=True,
                                  redisReal=True, expandedSessions=expanded, idleSessions=shrunk,
                                  stoppedSessions=remaining, cancelledQueryRecovered=True,
                                  cancelledInitializationClosed=True)))
        finally:
            await observer.close()
    finally:
        for namespace in namespaces:
            if namespace['db_pool'] is not None:
                await asyncio.wait_for(namespace['db_pool'].close(), 5)
        await redis.aclose()
        if previous is None:
            os.environ.pop('BOT_DB_POOL_IDLE_SECONDS', None)
        else:
            os.environ['BOT_DB_POOL_IDLE_SECONDS'] = previous
        if created:
            await admin.execute('DROP DATABASE "' + name + '" WITH (FORCE)')
        await admin.close()


if __name__ == '__main__':
    asyncio.run(asyncio.wait_for(main(), 45))
