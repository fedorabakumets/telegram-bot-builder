"""@fileoverview Проверяет загрузчик медиа, аренды и очистку отдельной активации."""
import asyncio
import gc
import os
import pathlib
import subprocess
import sys
import tempfile
import weakref
from aiohttp import web

source = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
compile(source, 'generated_media.py', 'exec')
namespace = {'PROJECT_ID': 12, '__file__': __file__}
exec(compile(source, 'generated_media.py', 'exec'), namespace)

async def main():
    """Проверяет кэш, версии, изоляцию, лимит и ошибки загрузки."""
    def released_namespace(root):
        """Доказывает, что atexit больше не удерживает выгруженный модуль."""
        class Marker:
            """Слабая метка жизненного цикла глобальных данных сценария."""
        scope = {'PROJECT_ID': 12, '__file__': __file__, 'marker': Marker()}
        reference = weakref.ref(scope['marker'])
        exec(compile(source, 'generated_media.py', 'exec'), scope)
        scope['_media_private_cache'](pathlib.Path(root))
        assert scope['_cleanup_media_original']() is True
        return reference
    with tempfile.TemporaryDirectory() as marker_root:
        reference = released_namespace(marker_root)
        gc.collect()
        assert reference() is None
    with tempfile.TemporaryDirectory() as cleanup_root:
        isolated = {'PROJECT_ID': 12, '__file__': __file__}
        exec(compile(source, 'generated_media.py', 'exec'), isolated)
        private = isolated['_media_private_cache'](pathlib.Path(cleanup_root))
        manual = pathlib.Path(cleanup_root) / 'manual.txt'
        manual.write_text('сохранить', encoding='utf-8')
        owned = private / 'leased.media'
        owned.write_bytes(b'media')
        ready, release = asyncio.Event(), asyncio.Event()
        async def hold_cleanup_lease():
            """Удерживает собственный файл до завершения задачи отправки."""
            isolated['_media_lease'](owned)
            ready.set()
            await release.wait()
        holder = asyncio.create_task(hold_cleanup_lease())
        await ready.wait()
        assert isolated['_cleanup_media_original']() is False
        assert owned.exists() and manual.exists()
        release.set()
        await holder
        assert isolated['_cleanup_media_original']() is True
        assert not private.exists() and manual.exists()
        assert not isolated['_media_cleanup_registered']
        assert not isolated['_media_task_leases'] and not isolated['_media_path_leases']
        assert isolated['_cleanup_media_original']() is True
        recreated = isolated['_media_private_cache'](pathlib.Path(cleanup_root))
        assert recreated != private and recreated.exists()
        assert isolated['_cleanup_media_original']() is True
    state = {'body': b'first', 'version': 'one', 'gets': 0, 'status': 200}
    async def handler(request):
        """Имитирует поток исходного файла и проверяет доступ к проекту."""
        assert request.query['projectId'] == '12'
        assert request.headers['Authorization'] == 'Bearer secret'
        if request.query['url'] == 'https://external.example/a':
            return web.Response(status=404, headers={'X-Media-Error': 'MEDIA_NOT_MANAGED'})
        if request.query['url'] == 'https://foreign.example/a':
            return web.Response(status=404, headers={'X-Media-Error': 'MEDIA_NOT_FOUND'})
        if request.query['url'].endswith('/slow'):
            await asyncio.sleep(0.2)
        if request.query['url'].endswith('/broken') and request.method == 'GET':
            response = web.StreamResponse(headers={'ETag': 'broken', 'Content-Length': '10'})
            await response.prepare(request)
            await response.write(b'abc')
            request.transport.close()
            return response
        if request.query['url'].endswith('/cancel') and request.method == 'GET':
            response = web.StreamResponse(headers={'ETag': state['version'], 'Content-Length': '5'})
            await response.prepare(request)
            await response.write(b'a')
            await asyncio.sleep(0.2)
            return response
        if state['status'] != 200:
            return web.Response(status=state['status'])
        if request.method == 'GET':
            state['gets'] += 1
        return web.Response(body=state['body'], headers={'ETag': state['version']})
    app = web.Application()
    app.router.add_get('/api/runtime/media', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 0)
    await site.start()
    port = site._server.sockets[0].getsockname()[1]
    with tempfile.TemporaryDirectory() as directory:
        probe = "import pathlib,sys; n={'__file__':sys.argv[1]}; exec(compile(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'),sys.argv[1],'exec'),n); print(n['_media_private_cache'](pathlib.Path(sys.argv[2])))"
        first = subprocess.check_output([sys.executable, '-c', probe, sys.argv[1], directory], text=True).strip()
        second = subprocess.check_output([sys.executable, '-c', probe, sys.argv[1], directory], text=True).strip()
        assert first != second and not pathlib.Path(first).exists() and not pathlib.Path(second).exists()
        os.environ.update(MEDIA_RUNTIME_BASE_URL=f'http://127.0.0.1:{port}', MEDIA_RUNTIME_TOKEN='secret', MEDIA_CACHE_DIR=directory, MEDIA_RUNTIME_PROJECT_ID='12', MEDIA_MAX_FILE_BYTES='10', MEDIA_CACHE_MAX_BYTES='20')
        resolve = namespace['resolve_media_original']
        assert not namespace['is_managed_media']('https://example.org/uploads/12/a')
        assert namespace['is_managed_media']('/api/media/s3-proxy/config/key')
        assert namespace['is_managed_media']('/api/storage/proxy/config/key')
        assert not await namespace['is_registered_media']('https://external.example/a')
        assert await namespace['is_registered_media']('https://registered.example/a')
        try:
            await namespace['is_registered_media']('https://foreign.example/a')
            raise AssertionError('Ожидалась ошибка доступа к чужому медиа')
        except namespace['MediaNotFoundError']:
            pass
        public_path = await resolve('https://registered.example/a')
        assert pathlib.Path(public_path).read_bytes() == b'first'
        state['gets'] = 0
        paths = await asyncio.gather(*(resolve('/uploads/12/a.jpg') for _ in range(5)))
        assert len(set(paths)) == 1 and pathlib.Path(paths[0]).read_bytes() == b'first'
        assert state['gets'] == 1
        state.update(body=b'second', version='two')
        path = await resolve('/uploads/12/a.jpg')
        assert path != paths[0] and pathlib.Path(path).read_bytes() == b'second'
        state.update(body=b'x' * 11, version='three')
        try:
            await resolve('/uploads/12/a.jpg')
            raise AssertionError('Ожидалось ограничение размера')
        except namespace['MediaSizeError']:
            pass
        state['status'] = 404
        try:
            await resolve('/uploads/12/missing')
            raise AssertionError('Ожидалась ошибка отсутствующего файла')
        except namespace['MediaNotFoundError']:
            pass
        state.update(status=200, body=b'first', version='broken')
        try:
            await resolve('/uploads/12/broken')
            raise AssertionError('Ожидалась ошибка разрыва загрузки')
        except namespace['MediaStorageError']:
            pass
        os.environ['MEDIA_TIMEOUT_SECONDS'] = '0.05'
        try:
            await resolve('/uploads/12/slow')
            raise AssertionError('Ожидалось истечение времени')
        except namespace['MediaTimeoutError']:
            pass
        os.environ['MEDIA_TIMEOUT_SECONDS'] = '5'
        task = asyncio.create_task(resolve('/uploads/12/cancel'))
        await asyncio.sleep(0.05)
        task.cancel()
        try:
            await task
            raise AssertionError('Ожидалась отмена')
        except asyncio.CancelledError:
            pass
        assert not list(pathlib.Path(directory).rglob('*.part'))
        os.environ['MEDIA_CACHE_DIR'] = str(pathlib.Path(directory) / 'lease-test')
        os.environ['MEDIA_CACHE_MAX_BYTES'] = '10'
        state.update(body=b'first', version='lease-one')
        ready, release = asyncio.Event(), asyncio.Event()
        async def hold():
            """Удерживает исходник до завершения отправляющей задачи."""
            path = await resolve('/uploads/12/leased')
            ready.set()
            await release.wait()
            assert pathlib.Path(path).read_bytes() == b'first'
        task = asyncio.create_task(hold())
        await ready.wait()
        state.update(body=b'second', version='lease-two')
        try:
            await resolve('/uploads/12/leased')
            raise AssertionError('Занятый файл нельзя удалять из кэша')
        except namespace['MediaSizeError']:
            pass
        release.set()
        await task
        await asyncio.sleep(0)
        new_path = await resolve('/uploads/12/leased')
        assert pathlib.Path(new_path).read_bytes() == b'second'
        state.update(body=b'first', version='lease-three')
        ready.clear()
        async def held_until_cancelled():
            """Проверяет освобождение аренды при отмене отправляющей задачи."""
            await resolve('/uploads/12/cancel-lease')
            ready.set()
            await asyncio.Event().wait()
        # Новый каталог исключает аренду текущей проверяющей задачи.
        os.environ['MEDIA_CACHE_DIR'] = str(pathlib.Path(directory) / 'cancel-lease-test')
        cancelled = asyncio.create_task(held_until_cancelled())
        await ready.wait()
        cancelled.cancel()
        try:
            await cancelled
        except asyncio.CancelledError:
            pass
        await asyncio.sleep(0)
        state.update(body=b'second', version='lease-four')
        assert pathlib.Path(await resolve('/uploads/12/cancel-lease')).read_bytes() == b'second'
        del os.environ['MEDIA_RUNTIME_BASE_URL']
        os.environ['MEDIA_LOCAL_ROOT'] = directory
        os.environ['MEDIA_RUNTIME_REQUIRED'] = '1'
        local = pathlib.Path(directory) / '12' / 'local.jpg'
        local.parent.mkdir()
        local.write_bytes(b'old')
        try:
            await resolve('/uploads/12/local.jpg')
            raise AssertionError('Ожидалась ошибка отсутствующего подключения к хранилищу')
        except namespace['MediaAccessError']:
            pass
        del os.environ['MEDIA_RUNTIME_REQUIRED']
        assert pathlib.Path(await resolve('/uploads/12/local.jpg')).read_bytes() == b'old'
        try:
            await resolve('/uploads/13/foreign')
            raise AssertionError('Ожидался отказ доступа к чужому проекту')
        except namespace['MediaAccessError']:
            pass
    await runner.cleanup()

asyncio.run(main())
print('OK: загрузка, параллельный кэш, версии, предел размера и изоляция')
