"""@fileoverview Проверяет сорок независимых инициализаций без внешних Redis и PostgreSQL."""
import ast
import asyncio
import contextvars
import gc
import json
import logging
import sys
import types


sys.stdin.reconfigure(encoding='utf-8')
source = json.load(sys.stdin)
cycles = int(sys.argv[1])
current = contextvars.ContextVar('resource_stress_slot')
original_sleep = asyncio.sleep
created = closed = active = peak = 0


async def fast_sleep(*args):
    """Сохраняет переключение задач, исключая реальные задержки повторов."""
    await original_sleep(0)


class Resource:
    """Поддельное соединение с явным подсчётом владения и закрытия."""

    def __init__(self):
        """Привязывает ресурс к текущему независимому экземпляру бота."""
        global created, active, peak
        self.owner = current.get()
        self.mode = self.owner['mode']
        self.finished = False
        self.connection_pool = self
        self.owner['resources'].append(self)
        created += 1
        active += 1
        peak = max(peak, active)

    def acquire(self):
        """Поддерживает контракт контекстного менеджера PostgreSQL."""
        return self

    async def __aenter__(self):
        """Возвращает ресурс без дополнительного соединения."""
        return self

    async def __aexit__(self, *args):
        """Завершает только захват, оставляя закрытие владельцу пула."""
        return None

    async def execute(self, *args):
        """Ожидает отмены либо воспроизводит сбой проверки после создания пула."""
        self.owner['entered'].set()
        if self.mode == 'cancel':
            await asyncio.Event().wait()
        await original_sleep(0)
        if self.mode != 'success':
            raise RuntimeError('локальная ошибка инициализации')

    async def ping(self):
        """Использует тот же сценарий проверки для Redis."""
        await self.execute()

    def terminate(self):
        """Идемпотентно освобождает ресурс только его владельца."""
        global active, closed
        assert current.get() is self.owner
        if not self.finished:
            self.finished = True
            active -= 1
            closed += 1

    async def close(self):
        """Проверяет резервный путь при ошибке штатного закрытия."""
        if self.mode == 'close_failure':
            raise RuntimeError('локальная ошибка закрытия')
        self.terminate()

    async def aclose(self):
        """Сохраняет контракт Redis-клиента."""
        await self.close()

    async def disconnect(self):
        """Проверяет резервное закрытие соединений Redis."""
        self.terminate()


async def create_pool(*args, **kwargs):
    """Создаёт исключительно локальный поддельный PostgreSQL-пул."""
    return Resource()


def from_url(*args, **kwargs):
    """Создаёт исключительно локальный поддельный Redis-клиент."""
    return Resource()


def function_code(text, name):
    """Компилирует настоящую функцию и её настройку пула без подмены логики генератора."""
    names = {name}
    if name == 'init_database':
        names.add('_database_pool_idle_seconds')
    nodes = [item for item in ast.parse(text).body
             if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name in names]
    assert {item.name for item in nodes} == names, ('Не найдены функции генератора', names)
    return compile(ast.Module(body=nodes, type_ignores=[]), '<generated>', 'exec')


async def check_slot(namespace, name, mode):
    """Останавливает только выбранную инициализацию, проверяя её результат."""
    marker = current.set(namespace)
    namespace['mode'] = mode
    namespace['entered'] = asyncio.Event()
    namespace['resources'] = []
    try:
        task = asyncio.create_task(namespace[name]())
        if mode == 'cancel':
            await namespace['entered'].wait()
            task.cancel()
            result = await asyncio.gather(task, return_exceptions=True)
            assert isinstance(result[0], asyncio.CancelledError)
        else:
            await task
        assert namespace['entered'].is_set(), (name, mode, 'Проверка ресурса не выполнялась')
        key = 'db_pool' if name == 'init_database' else '_redis_client'
        if mode == 'success':
            assert namespace[key] is not None
            await namespace[key].close()
            namespace[key] = None
        assert namespace[key] is None
        expected = 8 if name == 'init_redis_client' and mode in ('failure', 'close_failure') else 1
        resources = namespace['resources']
        assert len(resources) == expected, (name, mode, len(resources), expected)
        assert all(resource.finished for resource in resources), (name, mode, 'Ресурс не закрыт')
    finally:
        namespace.pop('resources', None)
        current.reset(marker)


async def main():
    """Повторяет сорок конкурентных запусков и проверяет нулевой остаток ресурсов."""
    global created, closed
    package = types.ModuleType('redis')
    package.asyncio = types.SimpleNamespace(from_url=from_url)
    sys.modules['redis'] = package
    sys.modules['redis.asyncio'] = package.asyncio
    logging.disable(logging.CRITICAL)
    asyncio.sleep = fast_sleep
    modes = ('failure', 'cancel', 'success', 'close_failure')
    for name, text in [('init_database', source['database']), ('init_redis_client', source['config'])]:
        code = function_code(text, name)
        namespaces = []
        for slot in range(40):
            ns = dict(logging=logging, db_pool=None, _redis_client=None,
                      DATABASE_URL='local-fake', REDIS_URL='local-fake', PROJECT_ID=slot,
                      TOKEN_ID=slot + 1, asyncpg=types.SimpleNamespace(create_pool=create_pool))
            exec(code, ns)
            namespaces.append(ns)
        baseline = len(asyncio.all_tasks())
        for cycle in range(cycles):
            await asyncio.gather(*(check_slot(ns, name, modes[(slot + cycle) % 4])
                                   for slot, ns in enumerate(namespaces)))
            await original_sleep(0)
            assert active == 0, (name, cycle, active)
            assert len(asyncio.all_tasks()) == baseline
        gc.collect()
        print(json.dumps(dict(phase=name, slots=40, cycles=cycles,
                              created=created, closed=closed, active=active, peak=peak,
                              pendingTasks=len(asyncio.all_tasks()) - baseline)), flush=True)


asyncio.run(main())
