/** @fileoverview Проверяет исполнением Python освобождение ресурсов неудачной инициализации. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { generateConfig } from '../templates/config/config.renderer';
import { generateDatabase } from '../templates/database/database.renderer';

/** Проверяет настройки реальных сгенерированных ветвей без подключения к PostgreSQL. */
for (const botRuntimeRole of [false, true]) {
  test(`простой PostgreSQL: значения и границы, runtime=${botRuntimeRole}`, () => {
    execute(generateDatabase({ userDatabaseEnabled: true, botRuntimeRole }), 'init_database', `
import os
class Resource:
    def acquire(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def execute(self, *args): pass
seen = []
async def create_pool(*args, **kwargs):
    seen.append(kwargs)
    return Resource()
namespace.update(db_pool=None, DATABASE_URL='fake', PROJECT_ID=1, TOKEN_ID=2,
                 asyncpg=types.SimpleNamespace(create_pool=create_pool))
async def check(ns):
    cases = [(None, 60), ('30', 30), ('0.5', .5), ('86400', 86400)]
    cases += [(value, 60) for value in ('nan', 'inf', '-inf', '0', '-1', '', '86401', 'abc')]
    for value, expected in cases:
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop('BOT_DB_POOL_IDLE_SECONDS', None)
            if value is not None: os.environ['BOT_DB_POOL_IDLE_SECONDS'] = value
            await ns['init_database']()
        assert seen[-1]['max_inactive_connection_lifetime'] == expected, (value, seen[-1])
        assert seen[-1]['min_size'] == 1 and seen[-1]['max_size'] == 10
`);
  });

  test(`отмена параллельной инициализации закрывает собственные пулы, runtime=${botRuntimeRole}`, () => {
    execute(generateDatabase({ userDatabaseEnabled: true, botRuntimeRole }), 'init_database', `
class Resource:
    def __init__(self): self.closed = 0; self.started = asyncio.Event()
    def acquire(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def execute(self, *args):
        self.started.set()
        await asyncio.Future()
    async def close(self): self.closed += 1
    def terminate(self): raise AssertionError('обычное закрытие доступно')
resources = []
async def create_pool(*args, **kwargs):
    resource = Resource()
    resources.append(resource)
    return resource
namespace.update(db_pool=None, DATABASE_URL='fake', PROJECT_ID=1, TOKEN_ID=2,
                 asyncpg=types.SimpleNamespace(create_pool=create_pool))
async def check(ns):
    import types
    owners = [dict(ns) for _ in range(8)]
    functions = [types.FunctionType(ns['init_database'].__code__, owner) for owner in owners]
    tasks = [asyncio.create_task(function()) for function in functions]
    await asyncio.sleep(0)
    await asyncio.gather(*(resource.started.wait() for resource in resources))
    for task in tasks: task.cancel()
    results = await asyncio.gather(*tasks, return_exceptions=True)
    assert len(resources) == 8 and all(resource.closed == 1 for resource in resources)
    assert all(isinstance(result, asyncio.CancelledError) for result in results)
    assert all(owner['db_pool'] is None for owner in owners)
`);
  });
}

test('RLS callback сохраняет область бота без удержания его глобального пространства', () => {
  execute(generateDatabase({ userDatabaseEnabled: true, botRuntimeRole: true }), 'init_database', `
import gc, weakref
class Marker: pass
class Resource:
    scope = None
    def acquire(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def execute(self, query, *values):
        if 'set_config' in query: self.scope = values
callbacks, resources = [], []
async def create_pool(*args, **kwargs):
    assert kwargs['init'] is kwargs['setup']
    callback = kwargs['setup']
    assert callback.__globals__ == {'__builtins__': {}}
    assert callback.__closure__ is None
    resource = Resource()
    await kwargs['init'](resource)
    resource.scope = ('wrong', 'wrong')
    await callback(resource)
    assert resource.scope == callback.__defaults__
    callbacks.append(callback)
    resources.append(resource)
    return resource
namespace.update(db_pool=None, DATABASE_URL='fake', PROJECT_ID=1, TOKEN_ID=2,
                 asyncpg=types.SimpleNamespace(create_pool=create_pool))
async def check(ns):
    async def activate(project, token):
        owner = dict(ns, PROJECT_ID=project, TOKEN_ID=token, marker=Marker())
        owner['init_database'] = types.FunctionType(ns['init_database'].__code__, owner)
        await owner['init_database']()
        assert owner['db_pool'] is resources[-1]
        return weakref.ref(owner['marker'])
    markers = [await activate(77, 7), await activate(88, 8)]
    assert [callback.__defaults__ for callback in callbacks] == [('77', '7'), ('88', '8')]
    gc.collect()
    assert all(marker() is None for marker in markers)
    for callback, resource in zip(callbacks, resources):
        resource.scope = ('wrong', 'wrong')
        await callback(resource)
        assert resource.scope == callback.__defaults__
`);
});

/** Выполняет извлечённую из генератора функцию с контролируемыми ресурсами. */
function execute(code: string, name: string, fixture: string): void {
  const script = `import ast, asyncio, logging, sys, types, unittest.mock\n` +
    `source = ${JSON.stringify(code)}\n` +
    `node = next(item for item in ast.parse(source).body if isinstance(item, ast.AsyncFunctionDef) and item.name == ${JSON.stringify(name)})\n` +
    `namespace = {'logging': logging}\n` + fixture +
    `\nhelpers = [item for item in ast.parse(source).body if isinstance(item, ast.FunctionDef) and item.name == '_database_pool_idle_seconds']\nexec(compile(ast.Module(body=helpers + [node], type_ignores=[]), '<generated>', 'exec'), namespace)\nasyncio.run(check(namespace))\n`;
  const result = spawnSync('python', ['-'], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || String(result.error));
}

test('неудачная проверка созданного PostgreSQL-пула закрывает его', () => {
  execute(generateDatabase({ userDatabaseEnabled: true }), 'init_database', `
class Resource:
    closed = 0
    terminated = 0
    def acquire(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def execute(self, *args): raise RuntimeError('проверка недоступна')
    async def close(self): self.closed += 1
    def terminate(self): self.terminated += 1
resource = Resource()
async def create_pool(*args, **kwargs): return resource
namespace.update(db_pool=None, DATABASE_URL='fake', PROJECT_ID=1, TOKEN_ID=2,
                 asyncpg=types.SimpleNamespace(create_pool=create_pool))
async def check(ns):
    await ns['init_database']()
    assert resource.closed == 1 and resource.terminated == 0
    assert ns['db_pool'] is None
`);
});

test('ошибка закрытия неудачного PostgreSQL-пула принудительно завершает его', () => {
  execute(generateDatabase({ userDatabaseEnabled: true }), 'init_database', `
class Resource:
    terminated = 0
    def acquire(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def execute(self, *args): raise RuntimeError('проверка недоступна')
    async def close(self): raise RuntimeError('закрытие недоступно')
    def terminate(self): self.terminated += 1
resource = Resource()
async def create_pool(*args, **kwargs): return resource
namespace.update(db_pool=None, DATABASE_URL='fake', PROJECT_ID=1, TOKEN_ID=2,
                 asyncpg=types.SimpleNamespace(create_pool=create_pool))
async def check(ns):
    await ns['init_database']()
    assert resource.terminated == 1 and ns['db_pool'] is None
`);
});

test('Redis закрывает ошибочные попытки, сохраняя успешное соединение', () => {
  execute(generateConfig({ userDatabaseEnabled: true, projectId: 1 }), 'init_redis_client', `
class Resource:
    def __init__(self, fail): self.fail, self.closed = fail, 0
    async def ping(self):
        if self.fail: raise RuntimeError('ping недоступен')
    async def aclose(self): self.closed += 1
resources = []
def from_url(*args, **kwargs):
    resource = Resource(len(resources) < 2)
    resources.append(resource)
    return resource
package = types.ModuleType('redis')
package.asyncio = types.SimpleNamespace(from_url=from_url)
sys.modules['redis'] = package
sys.modules['redis.asyncio'] = package.asyncio
namespace.update(REDIS_URL='fake', _redis_client=None)
async def sleep(*args): pass
async def check(ns):
    with unittest.mock.patch('asyncio.sleep', sleep):
        assert await ns['init_redis_client']()
    assert [resource.closed for resource in resources] == [1, 1, 0]
    assert ns['_redis_client'] is resources[-1]
`);
});

test('все неудачные Redis-попытки освобождают пул даже при ошибке aclose', () => {
  execute(generateConfig({ userDatabaseEnabled: true, projectId: 1 }), 'init_redis_client', `
class Resource:
    def __init__(self): self.disconnected = 0; self.connection_pool = self
    async def ping(self): raise RuntimeError('ping недоступен')
    async def aclose(self): raise RuntimeError('закрытие недоступно')
    async def disconnect(self): self.disconnected += 1
resources = []
def from_url(*args, **kwargs):
    resource = Resource()
    resources.append(resource)
    return resource
package = types.ModuleType('redis')
package.asyncio = types.SimpleNamespace(from_url=from_url)
sys.modules['redis'] = package
sys.modules['redis.asyncio'] = package.asyncio
namespace.update(REDIS_URL='fake', _redis_client=None)
async def sleep(*args): pass
async def check(ns):
    with unittest.mock.patch('asyncio.sleep', sleep):
        assert not await ns['init_redis_client']()
    assert len(resources) == 8 and all(resource.disconnected == 1 for resource in resources)
    assert ns['_redis_client'] is None
`);
});
