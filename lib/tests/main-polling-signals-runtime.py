"""@fileoverview Проверяет настоящий polling aiogram и владение сигналами Linux без подмены цикла событий."""
import asyncio
import gc
import json
import logging
from pathlib import Path
import signal
import sys
from unittest.mock import patch
import weakref

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'server/python'))
import lazy_aiogram
lazy_aiogram.enable()
from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.types import User

SOURCE = Path(sys.argv[1]).read_text(encoding='utf-8')


class Marker:
    """Слабо наблюдаемый объект пространства одного сценария."""
    pass


async def main():
    """Проверяет отсутствие сигналов бота в воркере и прежнюю политику отдельного процесса."""
    if sys.platform != 'linux':
        print('Проверка Linux signal map пропущена на другой ОС')
        return
    loop = asyncio.get_running_loop()
    initial = dict(loop._signal_handlers)
    original_signal = signal.signal
    saved = {key: signal.getsignal(key) for key in (signal.SIGTERM, signal.SIGINT)}
    entered = asyncio.Event()
    shutdowns = []
    references = []

    async def telegram(session, bot, method, timeout=None):
        """Подменяет только Telegram HTTP, сохраняя настоящий Dispatcher.start_polling."""
        name = type(method).__name__
        if name == 'GetMe':
            return User(id=bot.id, is_bot=True, first_name='Проверка', username='signal_probe_bot')
        if name == 'GetUpdates':
            entered.set()
            await asyncio.sleep(0.01)
            return []
        return True

    async def init_redis_client():
        """Отключает внешние ресурсы, не относящиеся к проверке сигналов."""
        return False

    async def cleanup_user_data():
        """Сохраняет жизненный цикл штатной фоновой задачи до остановки main."""
        await asyncio.Event().wait()

    async def stale_update_filter_middleware(handler, event, data):
        """Пропускает события без изменения работы настоящего Dispatcher."""
        return await handler(event, data)

    async def shutdown(**kwargs):
        """Подтверждает штатное завершение настоящего Dispatcher."""
        shutdowns.append(True)

    try:
        with patch.object(AiohttpSession, 'make_request', telegram):
            for index, mode in enumerate(['worker'] * 10 + ['standalone']):
                entered.clear()
                dispatcher = Dispatcher()
                dispatcher.shutdown.register(shutdown)
                bot = Bot(token=f'{18001 + index}:' + 'a' * 35)
                namespace = dict(__name__='signal_fixture', asyncio=asyncio, signal=signal,
                    logging=logging, db_pool=None, dp=dispatcher, bot=bot, _redis_client=None,
                    WEBHOOK_URL=None, BOT_TOKEN=bot.token, PROJECT_ID=77, TOKEN_ID=7,
                    init_redis_client=init_redis_client, cleanup_user_data=cleanup_user_data,
                    stale_update_filter_middleware=stale_update_filter_middleware, marker=Marker())
                references.append(weakref.ref(namespace['marker']))
                exec(compile(SOURCE, '<generated-main>', 'exec'), namespace)
                # Воспроизводим ровно существующий режим worker._main, не маскируя loop handlers.
                if mode == 'worker':
                    signal.signal = lambda *args, **kwargs: None
                    namespace['_worker_manages_signals'] = True
                task = asyncio.create_task(namespace['main']())
                try:
                    await asyncio.wait_for(entered.wait(), 5)
                    if mode == 'worker':
                        assert loop._signal_handlers == initial, ('Сигналы цикла изменены', mode)
                    else:
                        for key in (signal.SIGTERM, signal.SIGINT):
                            assert loop._signal_handlers[key]._callback.__self__ is dispatcher
                    namespace['request_bot_stop']()
                    await asyncio.wait_for(task, 5)
                    assert namespace['_bot_stop_event'] is None
                    assert len(shutdowns) == index + 1
                    if mode == 'worker':
                        assert loop._signal_handlers == initial
                finally:
                    if not task.done():
                        task.cancel()
                        await asyncio.gather(task, return_exceptions=True)
                    signal.signal = original_signal
                    # Это teardown отдельного процесса, только после проверки настоящей регистрации.
                    if mode == 'standalone':
                        for key in (signal.SIGTERM, signal.SIGINT):
                            if key not in initial:
                                loop.remove_signal_handler(key)
                    for key, handler in saved.items():
                        original_signal(key, handler)
                del task, namespace, dispatcher, bot
                gc.collect()
                assert all(reference() is None for reference in references)
        print(json.dumps(dict(workerCycles=10, standalonePolicy='SIGTERM/SIGINT зарегистрированы aiogram',
            shutdowns=len(shutdowns), loopSignalHandlers=len(initial), retainedNamespaces=0)))
    finally:
        signal.signal = original_signal
        for key, handler in saved.items():
            original_signal(key, handler)


asyncio.run(main())
