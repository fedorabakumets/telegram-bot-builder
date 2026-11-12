/** @fileoverview Проверки общего PID, независимых активаций, отмены и аварийного завершения общего канала. */
import test from "node:test";
import assert from "node:assert/strict";
import { SharedPollingHost } from "./sharedHost";
import type { RunnerConfig } from "../runnerConfig";
import type { PollingBot } from "./dispatcherTypes";

/** Минимальный общий процесс имитирует готовность и независимую выгрузку сценариев. */
const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});const out=x=>console.log(JSON.stringify({type:'process',pid:process.pid,...x}));rl.on('line',l=>{const x=JSON.parse(l);if(x.cmd==='init')out({event:'ready'});if(x.cmd==='shutdown')process.exit(0);if(x.cmd==='start')out({event:'ready',token_id:x.token_id,activation_id:x.activation_id});if(x.cmd==='stop')out({event:'exited',code:0,token_id:x.token_id,activation_id:x.activation_id});});`;
/** Создаёт тестовый бот без внешних сетевых подключений. */
const bot = (tokenId: number): PollingBot => ({ tokenId, token: `${tokenId}:secret_token_value`, botFile: 'fake', env: {}, projectId: 0, idleTimeout: 30, workerKey: '0', instance: 'test' });
/** Запускает подменённый транспорт с настоящими каналами ОС. */
const host = (script = fixture) => new SharedPollingHost({} as RunnerConfig, () => {}, () => {},
  { command: process.execPath, args: ['-e', script], env: process.env });

/** Дожидается завершения процесса, ограничивая проверку тремя секундами. */
async function until(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 3_000;
  while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(predicate(), 'Условие жизненного цикла не выполнено');
}

/** Проверяет существование именно тестового процесса без отправки ему сигнала. */
function alive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

test('создание общего обработчика не запускает процесс и не выделяет его память', async () => {
  const shared = host();
  assert.equal(shared.counters().pid, undefined);
  assert.equal(shared.counters().memoryKb, 0);
  await shared.shutdown();
});

test('два бота и повторное пробуждение используют один PID; stop не завершает соседа', async () => {
  const shared = host(fixture.replace("if(x.cmd==='init')out({event:'ready'})", "if(x.cmd==='init'){out({event:'ready'});out({event:'memory',pid:process.pid+1,memory_kb:12345})}"));
  try {
    const [one, two] = await Promise.all([shared.start(bot(1), new AbortController().signal), shared.start(bot(2), new AbortController().signal)]);
    assert.equal(one.actualPid, two.actualPid);
    assert.equal(shared.counters().memoryKb, 12345);
    await one.stop();
    assert.equal((await one.done).code, 0);
    assert.equal(shared.counters().activeHandlers, 1);
    assert.ok(alive(two.actualPid!));
    const again = await shared.start(bot(1), new AbortController().signal);
    assert.equal(again.actualPid, two.actualPid);
    await Promise.all([again.stop(), two.stop()]);
    assert.equal(shared.counters().activeHandlers, 0);
    await until(() => shared.counters().pid === undefined);
    assert.equal(shared.counters().memoryKb, 0);
    assert.equal(alive(two.actualPid!), false);
  } finally { await shared.shutdown(); }
});

test('самостоятельный сон последнего сценария завершает PID; следующее обновление создаёт новый', async () => {
  const script = fixture.replace("if(x.cmd==='start')out(", "if(x.cmd==='start'){setTimeout(()=>out({event:'exited',code:0,token_id:x.token_id,activation_id:x.activation_id}),100);}if(x.cmd==='start')out(");
  const shared = host(script);
  try {
    const first = await shared.start(bot(1), new AbortController().signal);
    const firstPid = first.actualPid!;
    await first.done;
    await until(() => shared.counters().pid === undefined);
    assert.equal(alive(firstPid), false);
    assert.equal(shared.counters().memoryKb, 0);
    const next = await shared.start(bot(1), new AbortController().signal);
    assert.notEqual(next.actualPid, firstPid);
    await next.stop();
  } finally { await shared.shutdown(); }
});

test('новый запуск во время закрытия последнего PID ожидает новый общий процесс', async () => {
  const script = fixture.replace("if(x.cmd==='shutdown')process.exit(0)", "if(x.cmd==='shutdown'){out({event:'closing'});setTimeout(()=>process.exit(0),150)}");
  let closing!: () => void;
  const closingEvent = new Promise<void>(resolve => { closing = resolve; });
  const shared = new SharedPollingHost({} as RunnerConfig, event => { if (event.event === 'closing') closing(); }, () => {},
    { command: process.execPath, args: ['-e', script], env: process.env });
  try {
    const first = await shared.start(bot(1), new AbortController().signal);
    const firstPid = first.actualPid!;
    const stopping = first.stop();
    await closingEvent;
    const second = await shared.start(bot(2), new AbortController().signal);
    await stopping;
    assert.notEqual(second.actualPid, firstPid);
    assert.equal(alive(firstPid), false);
    assert.equal(shared.counters().activeHandlers, 1);
    await second.stop();
  } finally { await shared.shutdown(); }
});

test('отмена запуска во время закрытия не создаёт новый PID и не оставляет активацию', async () => {
  const script = fixture.replace("if(x.cmd==='shutdown')process.exit(0)", "if(x.cmd==='shutdown'){out({event:'closing'});setTimeout(()=>process.exit(0),150)}");
  let closing!: () => void;
  const closingEvent = new Promise<void>(resolve => { closing = resolve; });
  const shared = new SharedPollingHost({} as RunnerConfig, event => { if (event.event === 'closing') closing(); }, () => {},
    { command: process.execPath, args: ['-e', script], env: process.env });
  try {
    const first = await shared.start(bot(1), new AbortController().signal);
    const stopping = first.stop();
    await closingEvent;
    const controller = new AbortController();
    const starting = shared.start(bot(2), controller.signal);
    controller.abort();
    await assert.rejects(starting, /отменён/);
    await stopping;
    await until(() => shared.counters().pid === undefined);
    assert.equal(shared.counters().activeHandlers, 0);
    assert.equal(shared.counters().memoryKb, 0);
  } finally { await shared.shutdown(); }
});

test('отмена до готовности сценария не оставляет активную регистрацию', async () => {
  const shared = host();
  const controller = new AbortController();
  const starting = shared.start(bot(3), controller.signal);
  controller.abort();
  await assert.rejects(starting, /отменён/);
  assert.equal(shared.counters().activeHandlers, 0);
  await shared.shutdown();
});

test('аварийный выход общего процесса завершает всех ботов с ошибкой', async () => {
  const shared = host();
  const [one, two] = await Promise.all([shared.start(bot(1), new AbortController().signal), shared.start(bot(2), new AbortController().signal)]);
  shared.kill();
  const results = await Promise.all([one.done, two.done]);
  assert.ok(results.every(result => result.code !== 0));
  assert.equal(shared.counters().activeHandlers, 0);
});
/** Проверяет очистку пользовательских секретов до передачи события исполнителю. */
test('события общей активации не раскрывают токен и секретное окружение', async () => {
  const events: Record<string, unknown>[] = [];
  const script = fixture.replace("if(x.cmd==='start')out(", "if(x.cmd==='start'){out({type:'stdout',activation_id:x.activation_id,token_id:x.token_id,content:x.token+' '+x.env.API_SECRET});}if(x.cmd==='start')out(");
  const shared = new SharedPollingHost({} as RunnerConfig, event => events.push(event), () => {},
    { command: process.execPath, args: ['-e', script], env: process.env });
  const registration = bot(1); registration.env.API_SECRET = 'private-api-secret';
  try {
    const child = await shared.start(registration, new AbortController().signal);
    const content = String(events.find(event => event.type === 'stdout')?.content);
    assert.equal(content, '[скрыто] [скрыто]');
    await child.stop();
  } finally { await shared.shutdown(); }
});
