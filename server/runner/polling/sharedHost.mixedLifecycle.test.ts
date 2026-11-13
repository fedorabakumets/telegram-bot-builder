/** @fileoverview Проверяет удержание общего PID постоянными ботами и независимую остановку смешанной группы. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { SharedPollingHost } from "./sharedHost";
import type { RunnerConfig } from "../runnerConfig";
import type { PollingBot } from "./dispatcherTypes";

/** Обслуживает оба протокола в одном реальном дочернем процессе, исключая внешнюю сеть. */
const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});
const out=x=>console.log(JSON.stringify({type:'process',pid:process.pid,...x}));
rl.on('line',line=>{const x=JSON.parse(line);
if(x.cmd==='init')out({event:'ready'});
if(x.cmd==='shutdown')process.exit(0);
if(x.cmd==='start_bot')out({type:'system',content:'bot_started:'+x.token_id});
if(x.cmd==='stop_bot')setTimeout(()=>out({type:'system',content:'bot_stopped:'+x.token_id}),50);
if(x.cmd==='stop')out({event:'exited',code:0,token_id:x.token_id,activation_id:x.activation_id});
if(x.cmd==='start'){out({event:'ready',token_id:x.token_id,activation_id:x.activation_id});
if(x.token_id===99)setTimeout(()=>process.exit(7),50);}});`;

/** Создаёт временную активацию в той же группе, что и постоянный сценарий. */
function bot(tokenId: number): PollingBot {
  return { tokenId, token: "fake", botFile: "fake.py", env: {}, projectId: 1,
    idleTimeout: 30, workerKey: "test", instance: "test" };
}

/** Запускает единый хост с контролируемым протоколом. */
function host(events: Record<string, unknown>[] = []) {
  return new SharedPollingHost({ pythonHost: "unified" } as RunnerConfig, event => events.push(event), () => {}, {
    command: process.execPath, args: ["-e", fixture], env: process.env,
  });
}

/** Дожидается физического закрытия последнего процесса после подтверждения очистки сценариев. */
async function closed(shared: SharedPollingHost): Promise<void> {
  const deadline = Date.now() + 3_000;
  while (shared.counters().pid !== undefined && Date.now() < deadline) await delay(10);
  assert.equal(shared.counters().pid, undefined);
}

test("сон временного бота сохраняет PID постоянного; остановка последнего освобождает процесс", async () => {
  const shared = host();
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 10, token: "fake" });
    const child = await shared.start(bot(1), new AbortController().signal);
    const pid = child.actualPid;
    await child.stop();
    await delay(75);
    assert.equal(shared.counters().actualPid, pid);
    assert.equal(shared.counters().activeHandlers, 0);
    assert.deepEqual(shared.counters().permanentTokenIds, [10]);
    await shared.stopPermanent(10);
    await closed(shared);
  } finally { await shared.shutdown(); }
});

test("остановка постоянного бота ожидает подтверждения и не завершает активного временного", async () => {
  const shared = host();
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 10, token: "fake" });
    const child = await shared.start(bot(1), new AbortController().signal);
    const pid = child.actualPid;
    const stopping = shared.stopPermanent(10);
    assert.deepEqual(shared.counters().permanentTokenIds, [10]);
    await stopping;
    assert.deepEqual(shared.counters().permanentTokenIds, []);
    assert.equal(shared.counters().actualPid, pid);
    assert.equal(shared.counters().activeHandlers, 1);
    await child.stop();
    await closed(shared);
  } finally { await shared.shutdown(); }
});

test("авария смешанного хоста снимает постоянные закрепления и сообщает ошибку постоянного бота", async () => {
  const events: Record<string, unknown>[] = [];
  const shared = host(events);
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 10, token: "fake" });
    const child = await shared.start(bot(99), new AbortController().signal);
    const pid = child.actualPid;
    assert.equal((await child.done).code, 7);
    assert.deepEqual(shared.counters().permanentTokenIds, []);
    assert.ok(events.some(event => event.type === "system" && event.content === "bot_exited:10:error"));
    await shared.sendPermanent({ cmd: "start_bot", token_id: 10, token: "fake" });
    assert.notEqual(shared.counters().actualPid, pid);
    await shared.stopPermanent(10);
    await closed(shared);
  } finally { await shared.shutdown(); }
});
