/** @fileoverview Проверяет исполнением Python освобождение ресурсов неудачной инициализации. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { generateConfig } from '../templates/config/config.renderer';
import { generateDatabase } from '../templates/database/database.renderer';

/** Выполняет извлечённую из генератора функцию с контролируемыми ресурсами. */
function execute(code: string, name: string, fixture: string): void {
  const script = `import ast, asyncio, logging, sys, types, unittest.mock\n` +
    `source = ${JSON.stringify(code)}\n` +
    `node = next(item for item in ast.parse(source).body if isinstance(item, ast.AsyncFunctionDef) and item.name == ${JSON.stringify(name)})\n` +
    `namespace = {'logging': logging}\n` + fixture +
    `\nexec(compile(ast.Module(body=[node], type_ignores=[]), '<generated>', 'exec'), namespace)\nasyncio.run(check(namespace))\n`;
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
