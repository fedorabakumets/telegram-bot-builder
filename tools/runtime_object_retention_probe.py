"""@fileoverview Наблюдает реальные объекты полного runtime в отдельных диагностических процессах."""

import argparse
import asyncio
import contextvars
from collections import Counter
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import tracemalloc
import uuid
import weakref
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/python'))


class Marker:
    """Помечает словарь активации, не сохраняя обратную ссылку на него."""


def arguments():
    """Читает параметры одинаковой нагрузки и отдельного измерения трассировщика."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--cycles', type=int, default=25)
    parser.add_argument('--idle', type=float, default=.05)
    parser.add_argument('--tracemalloc', action='store_true')
    parser.add_argument('--final-collect', action='store_true')
    parser.add_argument('--compare', action='store_true')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--scenario', choices=('normal', 'error', 'cancel', 'redis-reconnect'), default='normal')
    result = parser.parse_args()
    if result.cycles < 1 or result.idle < 0:
        parser.error('Число циклов положительно, ожидание неотрицательно')
    return result


def compare(args):
    """Запускает контроль и трассировку в свежих процессах с одинаковым сценарием."""
    for traced in (False, True):
        command = [sys.executable, str(Path(__file__).resolve()), '--source', str(args.source),
                   '--cycles', str(args.cycles), '--idle', str(args.idle), '--scenario', args.scenario]
        if traced:
            command.append('--tracemalloc')
        if args.final_collect:
            command.append('--final-collect')
        if args.output:
            command.extend(('--output', str(args.output.with_suffix('.traced.jsonl' if traced else '.plain.jsonl'))))
        subprocess.run(command, check=True, timeout=max(120, args.cycles * 10))


async def probe(args):
    """Исполняет полный генераторный сценарий с настоящими локальными PostgreSQL и Redis."""
    if args.tracemalloc:
        tracemalloc.start(8)
    spec = importlib.util.spec_from_file_location('_full_object_probe', ROOT / 'tools/runtime_full_resources_probe.py')
    full = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(full)
    import bot_task_scope
    import worker_unload_hooks

    objects = weakref.WeakValueDictionary()
    scopes = weakref.WeakValueDictionary()
    activations = 0
    traced_baseline = None
    original_cleanup = worker_unload_hooks.cleanup_module_hooks
    original_enter = bot_task_scope.BotTaskScope.enter
    original_run = full.BotWorker._run_bot
    from aiogram import Dispatcher
    original_dispatch = Dispatcher.feed_update
    failure_status = None
    final_resources = None
    recovery_verified = False
    fault_token = None

    async def activated(context, namespace, task):
        """Ждёт завершения намеренного сбоя до попытки доставлять обновление остановленному main."""
        if context.token_id == fault_token and args.scenario in ('error', 'cancel'):
            await asyncio.wait_for(asyncio.shield(task), 15)
            raise AssertionError('Ожидаемая остановка полного обработчика при проверке ошибки')

    async def dispatch(dispatcher, bot, update, **kwargs):
        """Проверяет восстановление настоящего Redis-соединения перед реальной командой."""
        nonlocal recovery_verified
        if args.scenario == 'redis-reconnect' and not recovery_verified:
            redis_client = dispatcher.fsm.storage._redis
            observer = full.redis.from_url(os.environ['PROBE_REDIS_URL'])
            key = 'object_probe_reconnect:' + uuid.uuid4().hex
            try:
                async with redis_client.client() as pinned:
                    before = await pinned.client_id()
                    assert await observer.client_kill_filter(_id=str(before)) == 1
                    first_command_failed = False
                    try:
                        await pinned.ping()
                    except full.redis.ConnectionError:
                        first_command_failed = True
                    assert await pinned.ping()
                    after = await pinned.client_id()
                    assert after != before, 'Разорванное сервером соединение не заменено'
                    await pinned.set(key, 'состояние восстановлено', ex=60)
                    assert await pinned.get(key) in ('состояние восстановлено', 'состояние восстановлено'.encode())
                    await pinned.delete(key)
                recovery_verified = True
                print(json.dumps({'redisReconnectVerified': True, 'serverDisconnectedOwnedConnection': True,
                                  'firstCommandFailed': first_command_failed, 'explicitRetryByProbe': True}), flush=True)
            finally:
                await observer.aclose()
        return await original_dispatch(dispatcher, bot, update, **kwargs)

    async def run(worker, context, demand=None):
        """Внедряет единичный сбой в настоящий внешний цикл полного main."""
        nonlocal failure_status
        if context.token_id == fault_token and args.scenario in ('error', 'cancel'):
            async def fault(dispatcher, bot, stop):
                """Завершает настоящий обработчик ошибкой либо настоящей отменой его Task."""
                context.module._probe_context = contextvars.copy_context()
                await asyncio.sleep(0)
                if args.scenario == 'cancel':
                    asyncio.current_task().cancel()
                    await asyncio.sleep(0)
                raise RuntimeError('Управляемый локальный сбой полного обработчика')
            demand.feed = fault
            try:
                return await original_run(worker, context, demand)
            finally:
                failure_status = context.status
        return await original_run(worker, context, demand)

    def enter(scope):
        """Регистрирует слабую ссылку на настоящий учёт задач активации."""
        scopes[id(scope)] = scope
        return original_enter(scope)

    async def cleanup(module, report):
        """Помечает реальные объекты до штатной резервной очистки воркера."""
        nonlocal activations
        if module is not None and '_object_retention_marker' not in vars(module):
            activations += 1
            marker = Marker()
            module._object_retention_marker = marker
            for name, value in (('globals', marker), ('module', module), ('bot', getattr(module, 'bot', None)),
                                ('dispatcher', getattr(module, 'dp', None)), ('handler_task', asyncio.current_task())):
                if value is not None:
                    objects[(activations, name)] = value
        await original_cleanup(module, report)

    def snapshot(frame):
        """Дополняет снимок счётчиками без сильных ссылок между контрольными точками."""
        nonlocal traced_baseline, final_resources
        counts = Counter(name for (_, name) in objects.keys())
        task_states = Counter()
        tracebacks = 0
        for (_, name), value in list(objects.items()):
            if name == 'handler_task':
                task_states['done' if value.done() else 'pending'] += 1
                exception = getattr(value, '_exception', None)
                tracebacks += int(exception is not None and exception.__traceback__ is not None)
        loop = asyncio.get_running_loop()
        timers = Counter()
        closed_scope_timers = 0
        for handle in list(getattr(loop, '_scheduled', ())):
            callback = getattr(handle, '_callback', None)
            timers['cancelled' if handle.cancelled() else getattr(callback, '__qualname__', type(callback).__name__)] += 1
            context = getattr(handle, '_context', None)
            if context is not None:
                closed_scope_timers += int(any(variable.name == 'bot_lifecycle_tasks' and getattr(value, 'closed', False)
                                              for variable, value in context.items()))
        frame['objectProbe'] = {
            'tracing': args.tracemalloc, 'activationsObservedAtUnload': activations,
            'liveObjects': dict(counts), 'handlerTasks': dict(task_states), 'taskTracebacks': tracebacks,
            'liveScopes': len(scopes), 'scopeOwnedTasks': sum(len(scope.tasks) for scope in list(scopes.values())),
            'closedScopes': sum(scope.closed for scope in list(scopes.values())),
            'scheduledHandles': len(getattr(loop, '_scheduled', ())),
            'scheduledCallbackKinds': dict(timers), 'timersWithClosedScopeContext': closed_scope_timers,
            'readyHandles': len(getattr(loop, '_ready', ())), 'gcCount': gc.get_count(),
            'tracedBytes': tracemalloc.get_traced_memory()[0] if args.tracemalloc else None,
            'tracerOverheadBytes': tracemalloc.get_tracemalloc_memory() if args.tracemalloc else None,
        }
        if args.tracemalloc and frame['stage'] == 'four_permanent':
            traced_baseline = tracemalloc.take_snapshot()
        if args.tracemalloc and traced_baseline is not None and frame['stage'].startswith(('all_stopped', 'diagnostic_gc')):
            frame['objectProbe']['allocationDelta'] = [
                {'location': str(item.traceback[0]), 'bytes': item.size_diff, 'count': item.count_diff}
                for item in tracemalloc.take_snapshot().compare_to(traced_baseline, 'lineno')[:12]
            ]
        if frame['stage'] == 'all_stopped':
            final_resources = {key: frame[key] for key in ('pgConnectionsIncludingObserver', 'redisClients', 'tasks', 'pools')}

    full.SNAPSHOT_HOOK = snapshot
    full.ACTIVATION_HOOK = activated
    full_arguments = ['--database', 'tbb_full_probe_objects_' + uuid.uuid4().hex[:12],
                      '--cycles', str(args.cycles), '--bots', '2', '--idle', str(args.idle),
                      '--real-bytecode-cache']
    if args.final_collect:
        full_arguments.append('--final-collect')
    options = full.parse_options(full_arguments)
    fault_token = 18000 + (int(hashlib.sha256(options.database.encode()).hexdigest()[:8], 16) % 1000000) * 1000 + 5
    with tempfile.TemporaryDirectory(prefix='tbb-object-probe-') as spool:
        os.environ['ANALYTICS_SPOOL_DIR'] = spool
        with patch.object(bot_task_scope.BotTaskScope, 'enter', enter), \
                patch.object(worker_unload_hooks, 'cleanup_module_hooks', cleanup), \
                patch.object(full.BotWorker, '_run_bot', run), \
                patch.object(Dispatcher, 'feed_update', dispatch):
            try:
                await full.isolated_run(args.source.read_text(encoding='utf-8-sig'), options)
            except BaseException as error:
                if (not isinstance(error, (AssertionError, asyncio.CancelledError))
                        or args.scenario not in ('error', 'cancel')
                        or failure_status != ('error' if args.scenario == 'error' else 'stopped')):
                    raise
                assert final_resources == {'pgConnectionsIncludingObserver': 1, 'redisClients': 1, 'tasks': 1, 'pools': {}}, final_resources
                print(json.dumps({'scenario': args.scenario, 'expectedFailureVerified': True,
                                  'workerStatus': failure_status, 'finalResources': final_resources}), flush=True)
            else:
                assert args.scenario not in ('error', 'cancel'), 'Ожидаемый сбой не воспроизведён'
                if args.scenario == 'redis-reconnect':
                    assert recovery_verified, 'Восстановление Redis не проверено'


if __name__ == '__main__':
    options = arguments()
    if options.compare:
        compare(options)
    elif options.output:
        with options.output.open('w', encoding='utf-8') as stream:
            original = sys.stdout
            try:
                sys.stdout = stream
                asyncio.run(probe(options))
            finally:
                sys.stdout = original
    else:
        asyncio.run(probe(options))
