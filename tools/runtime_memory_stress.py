"""@fileoverview Межплатформенная нагрузка общего Python с подменой Telegram и проверкой Redis."""
import argparse
import asyncio
import gc
import json
import logging
import os
from importlib.metadata import version
import platform
from pathlib import Path
import sys
import tempfile
import time
import tracemalloc
import types
import weakref
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/python'))


def options():
    """Разбирает одинаковые параметры нагрузки для Linux и Windows."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bots', type=int, default=40)
    parser.add_argument('--cycles', type=int, default=1000)
    parser.add_argument('--cycles-per-bot', type=int)
    parser.add_argument('--redis-url-env', help='Имя переменной окружения с адресом локального Redis')
    parser.add_argument('--permanent', type=int, default=4)
    parser.add_argument('--sample-every', type=int, default=100)
    parser.add_argument('--gc-mode', choices=('natural', 'collect'), default='natural')
    parser.add_argument('--aiogram-mode', choices=('lazy', 'eager'), default='lazy')
    parser.add_argument('--tracemalloc', action='store_true')
    parser.add_argument('--timeout', type=float, default=600)
    parser.add_argument('--payload-kib', type=int, default=256)
    parser.add_argument('--final-collect', action='store_true')
    result = parser.parse_args()
    if not 0 <= result.permanent < result.bots <= 1000:
        parser.error('Требуется 0 <= permanent < bots <= 1000')
    if result.cycles_per_bot is not None:
        if result.cycles_per_bot < 1:
            parser.error('Число пробуждений каждого бота должно быть положительным')
        result.cycles = result.cycles_per_bot * (result.bots - result.permanent)
    if result.redis_url_env and not os.environ.get(result.redis_url_env):
        parser.error('Переменная подключения Redis отсутствует')
    if result.cycles < 1 or result.sample_every < 1 or result.timeout <= 0 or result.payload_kib < 0:
        parser.error('Число циклов, период и таймаут должны быть положительными')
    return result


def emit(value):
    """Пишет отдельный JSON-кадр без пользовательских данных и секретов."""
    print(json.dumps(value, ensure_ascii=True), flush=True)


def partial(relative):
    """Читает реальный шаблон, удаляя только начальный комментарий Jinja."""
    source = (ROOT / 'lib/templates' / relative).read_text(encoding='utf-8')
    return source.split('#}', 1)[1] if source.lstrip().startswith('{#') else source


def memory():
    """Измеряет текущий RSS и доступный на Linux PSS, не используя пиковый ru_maxrss."""
    from process_memory import total_rss_kb
    result = {'rssKiB': total_rss_kb(), 'pssKiB': None, 'anonymousKiB': None}
    rollup = Path('/proc/self/smaps_rollup')
    if rollup.is_file():
        rows = dict(line.split(':', 1) for line in rollup.read_text().splitlines() if ':' in line)
        for source, target in (('Pss', 'pssKiB'), ('Anonymous', 'anonymousKiB')):
            result[target] = int(rows[source].split()[0]) if source in rows else None
    return result


def wrapper_depth(function):
    """Считает старую цепочку answer без сохранения исследуемых объектов."""
    seen = set()
    while callable(function) and id(function) not in seen:
        seen.add(id(function))
        cells = dict(zip(function.__code__.co_freevars, function.__closure__ or ()))
        previous = cells.get('_orig_answer')
        function = previous.cell_contents if previous else None
    return len(seen)


def fixture_source():
    """Собирает минимальный сценарий из настоящих трёх участков генерируемого кода."""
    analytics = partial('middleware/analytics-events.py.jinja2')
    analytics = analytics[:analytics.index('\ndef _analytics_event(')]
    redis = partial('utils/utils.py.jinja2')
    redis = redis[redis.index('async def _publish_log_to_redis'):]
    wrappers = partial('middleware/wrap-bot-answer.py.jinja2')
    return '''import asyncio, logging, weakref, os
import _runtime_memory_stress_state as probe
TOKEN_ID = int(os.environ['TOKEN_ID'])
PROJECT_ID = 1
class Payload:
    """Контрольный объект пространства имён одного сценария."""
    def __init__(self):
        """Создаёт одинаковую ограниченную нагрузку для обеих платформ."""
        self.data = bytearray(probe.payload_bytes)
payload = Payload()
probe.refs.append(weakref.ref(payload))
bot = probe.Bot(token=f"{TOKEN_ID}:" + 'a' * 35, session=probe.Session())
_redis_client = probe.Redis(TOKEN_ID)
def _fire_save_message(**kwargs):
    """Проверяет принадлежность записи текущему сценарию без базы данных."""
    from worker_isolation import current_token_id
    if current_token_id.get() != TOKEN_ID:
        probe.cross_calls += 1
    probe.sends[TOKEN_ID] = probe.sends.get(TOKEN_ID, 0) + 1
''' + analytics + '\n' + redis + '\n' + wrappers + '''
_WORKER_READY_PROTOCOL = True
async def main():
    """Имитирует активацию; остановку и очистку выполняет настоящий воркер."""
    _wrap_message_answer(bot)
    _analytics_install_log_filter()
    message = probe.Message(message_id=1, date=0, chat={'id': 1, 'type': 'private'}, text='in').as_(bot)
    try:
        await message.answer('ok')
        logging.info('Проверка жизненного цикла')
        await probe.flush(TOKEN_ID)
        _worker_bot_ready()
        await probe.stops[TOKEN_ID].wait()
    finally:
        await _cleanup_redis_log_handler()
        await _redis_client.aclose()
        await bot.session.close()
'''


async def exercise(args):
    """Держит постоянных соседей и последовательно выполняет заданное общее число пробуждений."""
    import lazy_aiogram
    aiogram_preimported = 'aiogram' in sys.modules
    memory_before_aiogram = memory()
    lazy_applied = lazy_aiogram.enable() if args.aiogram_mode == 'lazy' else False
    if args.aiogram_mode == 'lazy' and not lazy_applied:
        raise RuntimeError('Ленивая загрузка aiogram не применена: проверьте окружение и ранние импорты')
    from aiogram import Bot
    from aiogram.client.session.base import BaseSession
    from aiogram.types import Message
    import bot_env_overlay
    from worker import BotContext, BotWorker
    import worker_isolation
    bot_env_overlay.install()
    import_metadata = {'aiogramMode': args.aiogram_mode, 'lazyAiogramApplied': lazy_applied,
                       'aiogramPreimported': aiogram_preimported,
                       'lazyAiogramEnvironment': os.environ.get('AIOGRAM_LAZY_MODELS', 'default'),
                       'memoryBeforeAiogram': memory_before_aiogram, 'memoryAfterImports': memory()}
    emit({'phase': 'import_configuration', **import_metadata})

    class Session(BaseSession):
        """Заменяет только сетевой транспорт Telegram настоящего Bot."""
        async def close(self):
            """Сессия не владеет сетевым соединением."""
        async def make_request(self, bot, method, timeout=None):
            """Создаёт ответ с настоящей моделью Message."""
            return Message(message_id=1, date=0, chat={'id': 1, 'type': 'private'}, text='ok')
        async def stream_content(self, *values, **kwargs):
            """Реализует абстрактный интерфейс без загрузки файлов."""
            if False:
                yield b''

    class Redis:
        """Проверяет маршрутизацию и при необходимости использует настоящий Redis."""
        def __init__(self, token_id):
            """Запоминает владельца отдельной активации."""
            self.token_id = token_id
            self.client = redis_probe.client(token_id) if redis_probe else None
        async def publish(self, channel, body):
            """Проверяет отсутствие публикации от соседнего бота."""
            payload = json.loads(body)
            if payload['tokenId'] != self.token_id or worker_isolation.current_token_id.get() != self.token_id:
                state.cross_calls += 1
            if self.client:
                await self.client.publish(channel, body)
            state.publishes[self.token_id] = state.publishes.get(self.token_id, 0) + 1
        async def aclose(self):
            """Закрывает настоящий клиент после завершения доставки журналов."""
            if self.client:
                await self.client.aclose()

    state = types.ModuleType('_runtime_memory_stress_state')
    state.refs, state.sends, state.publishes, state.stops = [], {}, {}, {}
    state.cross_calls, state.payload_bytes = 0, args.payload_kib * 1024
    state.activations, state.wakes = {}, {}
    async def flush(token_id):
        """Дожидается публикации текущей активации до объявления готовности бота."""
        async def wait_delivery():
            """Не допускает остановку обработчика до подтверждения доставки."""
            while state.publishes.get(token_id, 0) < state.activations[token_id]:
                await asyncio.sleep(0.001)
        await asyncio.wait_for(wait_delivery(), 15)
    state.flush = flush
    state.Bot, state.Message, state.Session, state.Redis = Bot, Message, Session, Redis
    sys.modules[state.__name__] = state
    logging.getLogger().setLevel(logging.INFO)
    worker, active, failures, samples = BotWorker(), {}, [], []
    permanent_ids = list(range(100001, 100001 + args.permanent))
    temporary_ids = list(range(100001 + args.permanent, 100001 + args.bots))
    redis_probe = None
    if args.redis_url_env:
        from runtime_stress_redis import RedisProbe
        redis_probe = RedisProbe(os.environ[args.redis_url_env], permanent_ids + temporary_ids)
        await redis_probe.start()
    started, peak_active, explicit_collections = time.monotonic(), 0, 0
    if args.tracemalloc:
        tracemalloc.start()

    def sample(phase, cycle):
        """Записывает память и ограниченность глобальных реестров без принудительного GC по умолчанию."""
        nonlocal explicit_collections
        if args.gc_mode == 'collect':
            gc.collect()
            explicit_collections += 1
        handlers = logging.getLogger().handlers
        shared = getattr(Message, '_botcraft_answer_router_v1', ({}, {}))
        router = getattr(logging, '_botcraft_redis_log_router', None)
        frame = {'phase': phase, 'cycle': cycle, 'elapsedSeconds': round(time.monotonic() - started, 3),
                 **memory(), 'activeBots': len(active), 'retainedPayloads': sum(ref() is not None for ref in state.refs),
                 'wrapperDepth': wrapper_depth(Message.answer), 'answerRegistrations': len(shared[1]),
                 'rootHandlers': len(handlers), 'handlerFilters': sum(len(item.filters) for item in handlers),
                 'redisRegistrations': len(router._botcraft_redis_routes) if router else 0,
                 'asyncTasks': len(asyncio.all_tasks()), 'crossBotCalls': state.cross_calls,
                 'gcCounts': gc.get_count(), 'gcCollections': [item['collections'] for item in gc.get_stats()],
                 'explicitCollections': explicit_collections,
                 'tracedBytes': tracemalloc.get_traced_memory()[0] if args.tracemalloc else None,
                 'tracerOverheadBytes': tracemalloc.get_tracemalloc_memory() if args.tracemalloc else None}
        samples.append(frame)
        emit(frame)

    async def start(token_id):
        """Ожидает реальную готовность одной активации, сохраняя единственный общий интерпретатор."""
        nonlocal peak_active
        state.activations[token_id] = state.activations.get(token_id, 0) + 1
        state.stops[token_id] = asyncio.Event()
        context = BotContext(token_id, f'{token_id}:' + 'a' * 35, str(path))
        context.env = {}
        task = asyncio.create_task(worker._run_bot(context))
        active[token_id] = (context, task)
        peak_active = max(peak_active, len(active))
        while context.status != 'running' and not task.done():
            await asyncio.sleep(0)
        if task.done() or context.status == 'error':
            failures.append({'tokenId': token_id, 'stage': 'start'})

    async def stop(token_id):
        """Дожидается штатного finally воркера без ручной подмены глобальных методов."""
        context, task = active.pop(token_id)
        state.stops[token_id].set()
        await task
        state.stops.pop(token_id, None)
        if context.status == 'error':
            failures.append({'tokenId': token_id, 'stage': 'stop'})

    with tempfile.TemporaryDirectory(prefix='runtime-memory-stress-') as directory:
        path = Path(directory) / 'bot.py'
        source = fixture_source()
        path.write_text(source, encoding='utf-8')
        code = compile(source, str(path), 'exec')
        sample('before_load', 0)
        with patch('worker.bot_code_cache.load_bot_code', new=lambda *values: code), \
                patch('worker.emit_log', new=lambda *values: None), patch('worker.emit_system', new=lambda *values: None):
            try:
                for token_id in permanent_ids + temporary_ids:
                    await start(token_id)
                sample('all_bots_active', 0)
                for token_id in temporary_ids:
                    await stop(token_id)
                sample('permanent_neighbors_only', 0)
                for index in range(args.cycles):
                    token_id = temporary_ids[index % len(temporary_ids)]
                    await start(token_id)
                    await stop(token_id)
                    state.wakes[token_id] = state.wakes.get(token_id, 0) + 1
                    if (index + 1) % args.sample_every == 0 or index + 1 == args.cycles:
                        sample('wake_cycles', index + 1)
                # Соседи отвечают после нагрузки в собственном контексте, не затрагивая соседей.
                for token_id in permanent_ids:
                    context, _ = active[token_id]
                    marker = worker_isolation.current_token_id.set(token_id)
                    try:
                        message = Message(message_id=2, date=0, chat={'id': 1, 'type': 'private'}).as_(context.module.bot)
                        await message.answer('после нагрузки')
                    finally:
                        worker_isolation.current_token_id.reset(marker)
                if permanent_ids:
                    del context, message
                sample('neighbors_responded', args.cycles)
            finally:
                for token_id in list(active):
                    await stop(token_id)
        await asyncio.sleep(0)
        sample('all_stopped', args.cycles)
        await asyncio.sleep(1)
        sample('settled_natural', args.cycles)
        if args.final_collect:
            gc.collect()
            explicit_collections += 1
            sample('explicit_final_collection_diagnostic', args.cycles)
    redis_result = await redis_probe.finish() if redis_probe else None
    expected_sends = args.bots + args.cycles + args.permanent
    result = {'phase': 'summary', 'platform': platform.platform(), 'python': platform.python_version(),
              **import_metadata,
              'bots': args.bots, 'permanent': args.permanent, 'totalWakeCycles': args.cycles,
              'cyclesPerBotRequested': args.cycles_per_bot, 'activationsPerBot': state.activations,
              'wakeCyclesPerBot': state.wakes, 'redisVerification': redis_result,
              'temporaryIdentities': len(temporary_ids), 'totalActivationsIncludingInitialPeak': args.bots + args.cycles,
              'peakActiveBots': peak_active, 'gcMode': args.gc_mode, 'tracemalloc': args.tracemalloc,
              'gcEnabled': gc.isenabled(), 'gcThresholds': gc.get_threshold(), 'explicitCollections': explicit_collections,
              'aiogram': version('aiogram'), 'pydantic': version('pydantic'), 'optimize': sys.flags.optimize,
              'redisPy': version('redis') if redis_probe else None,
              'pythonMalloc': os.environ.get('PYTHONMALLOC', 'default'),
              'payloadKiBPerActivation': args.payload_kib, 'crossBotCalls': state.cross_calls,
              'errors': failures, 'actualSends': sum(state.sends.values()), 'expectedSends': expected_sends,
              'redisPublishes': sum(state.publishes.values()), 'finalMemory': memory(),
              'coverage': ('real_BotWorker_real_template_partials_real_Redis_fake_Telegram' if redis_probe
                           else 'real_BotWorker_real_template_partials_fake_Telegram_and_Redis_transport')}
    result['functionalOk'] = not failures and state.cross_calls == 0 and result['actualSends'] == expected_sends and peak_active == args.bots
    result['registrationsBounded'] = all(row['answerRegistrations'] == row['activeBots']
                                         and row['redisRegistrations'] == row['activeBots']
                                         and row['wrapperDepth'] == 1 for row in samples)
    result['retainedAfterOptionalDiagnostic'] = sum(ref() is not None for ref in state.refs)
    result['retentionVerdict'] = ('all_payloads_collectable' if args.final_collect and result['retainedAfterOptionalDiagnostic'] == 0
                                  else 'natural_gc_pending_objects_not_a_leak_verdict')
    result['ok'] = result['functionalOk'] and result['registrationsBounded']
    if args.cycles_per_bot:
        result['ok'] = result['ok'] and all(state.wakes.get(token_id) == args.cycles_per_bot for token_id in temporary_ids)
    if redis_result:
        result['redisDeliveryPerBotOk'] = all(redis_probe.received[token_id] == state.activations[token_id]
                                              for token_id in permanent_ids + temporary_ids)
        result['ok'] = result['ok'] and redis_result['ok'] and result['redisDeliveryPerBotOk']
    emit(result)
    return result['ok']


async def main(args):
    """Ограничивает весь эксперимент заданным временем."""
    return await asyncio.wait_for(exercise(args), timeout=args.timeout)


if __name__ == '__main__':
    sys.exit(0 if asyncio.run(main(options())) else 1)
