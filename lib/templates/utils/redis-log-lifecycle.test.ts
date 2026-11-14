/** @fileoverview Проверки изоляции Redis-журналов и освобождения обработчиков при выгрузке бота. */
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { generateUtils } from './utils-template.renderer';
import { validParamsDisabled } from './utils-template.fixture';

/** Исполняет сгенерированный передатчик в двух независимых namespace без настоящего Redis. */
it('изолирует публикации по контексту и освобождает регистрации, задачи и namespace после перезагрузки', () => {
  const utils = generateUtils(validParamsDisabled);
  const suffix = utils.slice(utils.indexOf('async def _publish_log_to_redis'));
  const script = `import asyncio, contextvars, gc, json, logging, sys, types, weakref
source = ${JSON.stringify(suffix)}
root = logging.getLogger()
root.setLevel(logging.INFO)
initial = len(root.handlers)
isolation = types.ModuleType('worker_isolation')
isolation.current_token_id = contextvars.ContextVar('test_token', default=0)
sys.modules['worker_isolation'] = isolation
class Marker:
    """Позволяет проверить сборку самого словаря globals, а не только оболочки модуля."""
    pass
class Redis:
    """Запоминает публикации и позволяет проверить отмену зависшего запроса."""
    def __init__(self):
        self.rows = []
        self.block = False
    async def publish(self, channel, payload):
        self.rows.append((channel, json.loads(payload)))
        if self.block:
            await asyncio.Event().wait()
def load(token, redis):
    """Загружает изолированный namespace очередного запуска."""
    module = types.ModuleType('fixture_bot_' + str(token))
    module.sentinel = Marker()
    module.__dict__.update(asyncio=asyncio, logging=logging, _redis_client=redis, PROJECT_ID=12, TOKEN_ID=token)
    exec(source, module.__dict__)
    return module
async def run():
    """Проверяет отсутствие регистрации без Redis, маршрутизацию и повторную выгрузку."""
    empty = load(1, None)
    assert len(root.handlers) == initial
    await empty._cleanup_redis_log_handler()
    one, two = Redis(), Redis()
    a, b = load(11, one), load(22, two)
    assert len(root.handlers) == initial + 1
    for token, message in [(11, 'first'), (22, 'second'), (0, 'unscoped')]:
        isolation.current_token_id.set(token)
        root.info(message)
    await asyncio.sleep(0)
    assert [row[1]['message'] for row in one.rows] == ['first'], one.rows
    assert [row[1]['message'] for row in two.rows] == ['second'], two.rows
    assert one.rows[0][0] == 'bot:logs:12:11'
    one.block = True
    isolation.current_token_id.set(11)
    root.info('pending')
    await asyncio.sleep(0)
    relay = a._redis_log_handler
    assert len(relay.tasks) == 1
    await a._cleanup_redis_log_handler()
    assert not relay.tasks and relay.stopped
    await a._cleanup_redis_log_handler()
    await b._cleanup_redis_log_handler()
    assert len(root.handlers) == initial
    refs = []
    for index in range(50):
        module = load(33, Redis())
        refs.append(weakref.ref(module.sentinel))
        await module._cleanup_redis_log_handler()
        del module
    gc.collect()
    assert all(ref() is None for ref in refs)
    assert len(root.handlers) == initial
    del sys.modules['worker_isolation']
    standalone = Redis()
    module = load(44, standalone)
    root.info('standalone')
    await asyncio.sleep(0)
    assert standalone.rows[0][1]['message'] == 'standalone'
    await module._cleanup_redis_log_handler()
    assert len(root.handlers) == initial
asyncio.run(run())
`;
  expect(() => execFileSync('python', ['-c', script], { stdio: 'pipe' })).not.toThrow();
});
