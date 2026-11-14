"""@fileoverview Измеряет локальные HTTP/TLS, DNS и Redis без обращения к Telegram."""
import argparse
import asyncio
import gc
import json
import os
from pathlib import Path
import ssl
import subprocess
import sys
import tempfile
import threading
import time
from urllib.parse import urlsplit
import uuid
import weakref
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server/python'))
import lazy_aiogram
lazy_aiogram.enable()
from aiohttp import web
from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from redis.asyncio import Redis
import certifi


def process_memory():
    """Читает текущий Linux RSS/PSS, а не пиковый расход ru_maxrss."""
    values = {}
    for line in Path('/proc/self/smaps_rollup').read_text().splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            if value.strip().endswith('kB'):
                values[key] = int(value.split()[0]) * 1024
    return {'rss': values['Rss'], 'pss': values['Pss'], 'anonymous': values['Anonymous']}


async def telegram_response(request):
    """Возвращает фиксированный успешный getMe только на локальном HTTP-сервере."""
    await request.read()
    return web.json_response({'ok': True, 'result': {
        'id': 123456, 'is_bot': True, 'first_name': 'Локальная проверка', 'username': 'local_probe_bot'}})


async def exercise(args):
    """Создаёт и закрывает настоящие транспорты, сохраняя только слабые ссылки."""
    if urlsplit(args.redis_url).hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Разрешён только локальный Redis')
    if not 1 <= args.cycles <= 10000 or not 1 <= args.batch <= 32:
        raise ValueError('Недопустимое число циклов или размер пакета')
    prefix = 'tbb:transport-probe:' + uuid.uuid4().hex
    observer = Redis.from_url(args.redis_url, client_name=prefix + ':observer')
    await observer.ping()
    refs = []
    totals = {'completed': 0, 'http': 0, 'redis': 0}
    started = time.monotonic()
    loop = asyncio.get_running_loop()
    with tempfile.TemporaryDirectory(prefix='tbb-transport-tls-') as directory:
        cert, key = Path(directory) / 'cert.pem', Path(directory) / 'key.pem'
        server_ssl = None
        if args.tls:
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                            '-keyout', str(key), '-out', str(cert), '-days', '1', '-subj',
                            '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'],
                           check=True, capture_output=True, timeout=15)
            server_ssl = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            server_ssl.load_cert_chain(cert, key)
        app = web.Application()
        app.router.add_post('/bot{token}/getMe', telegram_response)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '127.0.0.1', 0, ssl_context=server_ssl)
        await site.start()
        port = site._server.sockets[0].getsockname()[1]
        host = 'localhost' if args.dns else '127.0.0.1'
        api = TelegramAPIServer.from_base(f"{'https' if args.tls else 'http'}://{host}:{port}")
        # Эксперимент переиспользует только неизменяемое доверие TLS, но не сессии и соединения ботов.
        shared_ssl = None
        if args.shared_ssl_context:
            shared_ssl = ssl.create_default_context(cafile=certifi.where())
            if args.tls:
                shared_ssl.load_verify_locations(cafile=str(cert))

        async def sample(phase):
            """Выводит только числовые счётчики, не адреса с паролями и не токены."""
            clients = await observer.client_list()
            own = [item for item in clients if str(item.get('name', '')).startswith(prefix)]
            print(json.dumps({'phase': phase, 'cycles': totals['completed'], 'seconds': time.monotonic() - started,
                              **process_memory(), 'threads': threading.active_count(),
                              'executorThreads': len(getattr(getattr(loop, '_default_executor', None), '_threads', ())),
                              'fds': len(list(Path('/proc/self/fd').iterdir())),
                              'tasks': len(asyncio.all_tasks()), 'scheduled': len(loop._scheduled),
                              'activeTimers': sum(not handle.cancelled() for handle in loop._scheduled),
                              'redisClients': len(own), 'streamLength': await observer.xlen(prefix + ':stream'),
                              'weakAlive': sum(reference() is not None for reference in refs), **totals}), flush=True)

        async def activation(index):
            """Проверяет HTTP, DNS и Redis одной активации и закрывает их в finally."""
            if shared_ssl is not None:
                with patch('aiogram.client.session.aiohttp.ssl.create_default_context', return_value=shared_ssl):
                    session = AiohttpSession(api=api)
            else:
                session = AiohttpSession(api=api)
            if args.tls and shared_ssl is None:
                session._connector_init['ssl'].load_verify_locations(cafile=str(cert))
            bot = Bot('123456:' + 'a' * 35, session=session)
            client = Redis.from_url(args.redis_url, client_name=prefix + ':cycle')
            refs.extend((weakref.ref(session), weakref.ref(bot), weakref.ref(client),
                         weakref.ref(client.connection_pool)))
            try:
                result = await bot.get_me()
                assert result.id == 123456
                totals['http'] += 1
                await client.set(prefix + ':value:' + str(index), str(index), ex=60)
                assert await client.get(prefix + ':value:' + str(index)) == str(index).encode()
                await client.xadd(prefix + ':stream', {'n': index}, maxlen=100, approximate=False)
                await client.delete(prefix + ':value:' + str(index))
                totals['redis'] += 1
                if args.dns:
                    await loop.getaddrinfo('localhost', port)
                totals['completed'] += 1
            finally:
                await client.aclose()
                await session.close()

        try:
            await sample('baseline')
            next_sample = 100
            for start in range(0, args.cycles, args.batch):
                await asyncio.gather(*(activation(index) for index in range(start, min(start + args.batch, args.cycles))))
                if totals['completed'] >= next_sample or totals['completed'] == args.cycles:
                    await sample('running')
                    next_sample = (totals['completed'] // 100 + 1) * 100
            await asyncio.sleep(1)
            await sample('idle_natural')
            gc.collect()
            await asyncio.sleep(0)
            await sample('diagnostic_gc')
            assert not any(reference() is not None for reference in refs), 'Транспорт удерживается после GC'
            assert await observer.xlen(prefix + ':stream') <= 100
            assert totals['completed'] == args.cycles == totals['http'] == totals['redis']
        finally:
            await runner.cleanup()
            keys = [item async for item in observer.scan_iter(match=prefix + ':*')]
            if keys:
                await observer.delete(*keys)
            await observer.aclose()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cycles', type=int, default=100)
    parser.add_argument('--batch', type=int, default=10)
    parser.add_argument('--redis-url', default=os.environ.get('LOCAL_REDIS_TEST_URL', 'redis://127.0.0.1:6379/14'))
    parser.add_argument('--dns', action='store_true')
    parser.add_argument('--tls', action='store_true')
    parser.add_argument('--shared-ssl-context', action='store_true')
    options = parser.parse_args()
    asyncio.run(asyncio.wait_for(exercise(options), timeout=600))
