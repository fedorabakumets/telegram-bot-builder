/**
 * @fileoverview Фазовая проверка внешнего приёмника и жизненного цикла сгенерированного бота.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { generatePythonCode } from '../bot-generator';
import { generateMain } from '../templates/main/main.renderer';

/** Исполняет настоящий сгенерированный main с изолированными внешними зависимостями. */
function executeMain(failure: string): string[] {
  const code = generateMain({ userDatabaseEnabled: false });
  const python = existsSync('.venv/Scripts/python.exe') ? '.venv/Scripts/python.exe' : 'python';
  const script = `
import asyncio, json, sys, types
payload = json.loads(sys.stdin.buffer.read().decode("utf-8"))
events = []
class Observer:
    def __init__(self): self.callbacks = []
    def middleware(self, *args): pass
    def register(self, callback): self.callbacks.append(callback)
class Redis:
    async def set(self, *args, **kwargs):
        events.append("lock")
        return True
    async def eval(self, *args):
        events.append("unlock")
        return 1
    async def aclose(self): events.append("redis_close")
    async def publish(self, *args): raise AssertionError("Сон не публикует запуск или остановку")
class Dispatcher:
    def __init__(self):
        self.fsm = types.SimpleNamespace(storage=None)
        self.message = Observer()
        self.startup = Observer()
        self.workflow_data = {}
    async def emit_startup(self, **kwargs): events.append("startup")
    async def start_polling(self, bot, **kwargs):
        events.append("startup")
        for callback in self.startup.callbacks: await callback()
        namespace["_bot_stop_event"].set()
    def resolve_used_update_types(self): return ["message"]
    async def emit_shutdown(self, **kwargs):
        events.append("shutdown")
        if payload["failure"] == "shutdown": raise RuntimeError("Проверка ошибки завершения")
class Session:
    async def close(self): events.append("session_close")
class Bot:
    session = Session()
    async def get_me(self):
        events.append("get_me")
        if payload["failure"] == "direct_get_me": raise RuntimeError("Ошибка getMe")
async def init_redis_client(): return payload["failure"] not in {"redis", "direct_no_lease"}
async def cleanup_user_data(): await asyncio.Event().wait()
async def external(dp, bot, stop_event):
    events.append("external")
    if payload["failure"] == "external": raise RuntimeError("Проверка ошибки обработки")
namespace = dict(__name__="external_test", asyncio=asyncio,
    signal=types.SimpleNamespace(SIGTERM=15, SIGINT=2, signal=lambda *args: None),
    logging=types.SimpleNamespace(info=lambda *args: None, error=lambda *args: None),
    db_pool=None, dp=Dispatcher(), bot=Bot(), _redis_client=Redis(), _redis_connected=False,
    TOKEN_ID=1, BOT_TOKEN="test", PROJECT_ID=1, WEBHOOK_URL="", WEBHOOK_PORT=9001,
    RedisStorage=lambda *args: object(), init_redis_client=init_redis_client,
    cleanup_user_data=cleanup_user_data, stale_update_filter_middleware=object(),
    _worker_external_updates=external, _worker_bot_ready=lambda: events.append("ready"))
async def direct_prepare(lease_owned):
    events.append("direct_prepare" if lease_owned else "direct_prepare_without_lease")
    if payload["failure"] in {"direct_prepare", "direct_no_lease"}:
        raise RuntimeError("Проверка отказа переноса состояния")
async def direct_commit(): events.append("direct_commit")
if payload["failure"].startswith("direct_"):
    namespace.pop("_worker_external_updates")
    namespace["_worker_direct_prepare"] = direct_prepare
    namespace["_worker_direct_commit"] = direct_commit
exec(compile(payload["code"], "generated-main.py", "exec"), namespace)
try:
    asyncio.run(namespace["main"]())
except RuntimeError:
    if not payload["failure"]: raise
print(json.dumps(events))
`;
  const result = spawnSync(python, ['-c', script], {
    input: JSON.stringify({ code, failure }), encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim().split('\n').at(-1)!);
}

/** Проверяет startup, готовность, обработку и освобождение реальных веток main. */
for (const failure of ['', 'external', 'shutdown']) {
  test(`внешний приёмник освобождает ресурсы: ${failure || 'обычное завершение'}`, () => {
    assert.deepEqual(executeMain(failure), [
      'get_me', 'startup', 'ready', 'external', 'shutdown', 'redis_close', 'session_close',
    ]);
  });
}

/** Проверяет отказ от сна для узлов с независимым жизненным циклом. */
for (const flag of ['hasScheduleTrigger', 'hasApiTrigger', 'hasUserbotNodes', 'hasBackgroundTimers']) {
  test(`маркер запрещает сон при ${flag}`, () => {
    assert.ok(generateMain({ [flag]: true }).includes('_WORKER_EXTERNAL_UPDATES_SAFE = False'));
  });
}

test('обычная сборка поддерживает внешний приёмник без удаления direct/webhook', () => {
  const code = generateMain({});
  assert.ok(code.includes('_WORKER_EXTERNAL_UPDATES_PROTOCOL = True'));
  assert.ok(code.includes('_WORKER_EXTERNAL_STATE_PROTOCOL = 1'));
  assert.ok(code.includes('if _external_mode and (not _redis_connected or _redis_client is None):'));
  assert.ok(code.includes('_WORKER_EXTERNAL_UPDATES_SAFE = True'));
  assert.ok(code.includes('if not WEBHOOK_URL and not _external_mode and _redis_connected'));
  assert.match(code, /if not _external_mode:\s+dp\.message\.middleware\(stale_update_filter_middleware\)/);
  assert.ok(code.includes('dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())'));
  assert.ok(code.includes('if WEBHOOK_URL:'));
});

/** Проверяет передачу признаков фоновой работы из настоящего графа в главный шаблон. */
for (const [type, data] of [
  ['delay', { mode: 'background' }],
  ['message', { inputTimeout: 60 }],
  ['parallel_split', { awaitAll: false, parallelBranches: [] }],
] as const) {
  test(`граф ${type} запрещает сон при фоновой работе`, () => {
    const project = { sheets: [{ id: 's1', name: 'Проверка', nodes: [
      { id: 'node1', type, position: { x: 0, y: 0 }, data: { buttons: [], ...data } },
    ] }], version: 2, activeSheetId: 's1' };
    const code = generatePythonCode(project as any, { botName: 'Проверка', userDatabaseEnabled: false });
    assert.ok(code.includes('_WORKER_EXTERNAL_UPDATES_SAFE = False'));
  });
}

/** Проверяет отказ от внешней обработки без надёжного хранилища состояния. */
test('недоступный Redis не включает обработчик или локальное FSM', () => {
  assert.deepEqual(executeMain('redis'), ['session_close']);
});

/** Отказ переноса состояния должен прервать direct после захвата, до чтения обновлений. */
test('переключение на direct подготавливает состояние под общей блокировкой', () => {
  assert.deepEqual(executeMain('direct_prepare'), ['lock', 'direct_prepare', 'unlock', 'session_close']);
  assert.ok(generateMain({}).includes('_WORKER_DIRECT_PREPARE_PROTOCOL = 1'));
});

/** Не скрывает отсутствие владения при недоступном Redis во время перехода на direct. */
test('перенос direct получает явное отсутствие блокировки при ошибке Redis', () => {
  assert.deepEqual(executeMain('direct_no_lease'), ['direct_prepare_without_lease', 'session_close']);
});

/** Снимок удаляется после готовности Telegram и startup диспетчера, до сигнала готовности. */
test('direct подтверждает перенос состояния после успешного запуска', () => {
  assert.deepEqual(executeMain('direct_success'), [
    'lock', 'direct_prepare', 'get_me', 'startup', 'direct_commit', 'ready', 'unlock', 'session_close',
  ]);
});

/** Неудачный getMe сохраняет снимок для следующего запуска. */
test('ошибка запуска direct не подтверждает удаление снимка состояния', () => {
  assert.deepEqual(executeMain('direct_get_me'), [
    'lock', 'direct_prepare', 'get_me', 'unlock', 'session_close',
  ]);
});
