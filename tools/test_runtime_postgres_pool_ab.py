"""@fileoverview Сравнивает стоимость простоя настоящего локального пула PostgreSQL."""
import asyncio
import ctypes
import json
import logging
import os
import statistics
import time
import uuid
from urllib.parse import urlsplit, urlunsplit

import asyncpg
from test_runtime_postgres_pool import generated_init, local_urls


def rss_bytes():
    """Возвращает текущую резидентную память клиента Python без серверной памяти PostgreSQL."""
    if os.name != 'nt':
        with open('/proc/self/statm', encoding='ascii') as source:
            return int(source.read().split()[1]) * os.sysconf('SC_PAGE_SIZE')
    class Counters(ctypes.Structure):
        """Содержит счётчики памяти текущего процесса Windows."""
        _fields_ = [('cb', ctypes.c_ulong), ('faults', ctypes.c_ulong)] + [
            (name, ctypes.c_size_t) for name in ('peak', 'working', 'peak_paged', 'paged',
                                               'peak_nonpaged', 'nonpaged', 'pagefile', 'peak_pagefile')]
    counters = Counters()
    counters.cb = ctypes.sizeof(counters)
    ctypes.windll.kernel32.GetCurrentProcess.restype = ctypes.c_void_p
    handle = ctypes.windll.kernel32.GetCurrentProcess()
    ctypes.windll.psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
    if not ctypes.windll.psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb):
        raise ctypes.WinError()
    return counters.working


async def run_mode(url, code, observer, name, seconds):
    """Выполняет сто всплесков по шесть соединений с одинаковыми окнами простоя."""
    os.environ['BOT_DB_POOL_IDLE_SECONDS'] = str(seconds)
    namespace = dict(asyncpg=asyncpg, asyncio=asyncio, os=os, logging=logging,
                     db_pool=None, DATABASE_URL=url, PROJECT_ID=77, TOKEN_ID=1)
    exec(code, namespace)
    await namespace['init_database']()
    pool = namespace['db_pool']
    durations = []
    samples = []
    start_rss = rss_bytes()
    started = time.perf_counter()
    try:
        for cycle in range(1, 101):
            before = time.perf_counter()
            connections = await asyncio.gather(*(pool.acquire() for _ in range(6)))
            try:
                # Разные тексты готовят пятнадцать запросов в штатном кэше каждого соединения.
                for query in range(15):
                    results = await asyncio.gather(*(
                        connection.fetchval(f'SELECT $1::integer + {query}', 10)
                        for connection in connections))
                    assert results == [10 + query] * 6
            finally:
                await asyncio.gather(*(pool.release(connection) for connection in connections))
            durations.append((time.perf_counter() - before) * 1000)
            await asyncio.sleep(0.6)
            if cycle in (1, 10, 50, 100):
                sessions = await observer.fetchval(
                    'SELECT count(*) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', name)
                samples.append(dict(cycle=cycle, rss_bytes=rss_bytes(), pool=pool.get_size(),
                                    idle=pool.get_idle_size(), server_sessions=sessions))
        return dict(idle_seconds=seconds, cycles=100, burst_size=6, start_rss_bytes=start_rss,
                    final_rss_bytes=rss_bytes(), duration_seconds=time.perf_counter() - started,
                    burst_median_ms=statistics.median(durations), burst_max_ms=max(durations), samples=samples)
    finally:
        await pool.close()


async def main():
    """Создаёт изолированную локальную БД, сравнивает режимы и удаляет только свою БД."""
    database_url, _ = local_urls()
    parts = urlsplit(database_url)
    admin = await asyncpg.connect(urlunsplit(parts._replace(path='/postgres')))
    name = 'tbb_pool_ab_' + uuid.uuid4().hex
    url = urlunsplit(parts._replace(path='/' + name))
    created = False
    previous = os.environ.get('BOT_DB_POOL_IDLE_SECONDS')
    try:
        await admin.execute('CREATE DATABASE "' + name + '"')
        created = True
        observer = await asyncpg.connect(url)
        try:
            await observer.execute('CREATE FUNCTION public.mark_analytics_runtime_v2(integer, integer) RETURNS void LANGUAGE sql AS $$ SELECT $$')
            code = generated_init()
            # Режимы сравниваются в одном процессе: абсолютный RSS второго не является независимой базой.
            for seconds in (300, 0.5):
                result = await run_mode(url, code, observer, name, seconds)
                print(json.dumps(result), flush=True)
        finally:
            await observer.close()
    finally:
        if previous is None:
            os.environ.pop('BOT_DB_POOL_IDLE_SECONDS', None)
        else:
            os.environ['BOT_DB_POOL_IDLE_SECONDS'] = previous
        if created:
            await admin.execute('DROP DATABASE "' + name + '" WITH (FORCE)')
        await admin.close()


if __name__ == '__main__':
    asyncio.run(main())
