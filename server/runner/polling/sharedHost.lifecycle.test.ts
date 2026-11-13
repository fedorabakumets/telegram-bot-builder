/** @fileoverview Регрессии поколений активаций, отмены запуска и восстановления общего интерпретатора. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SharedPollingHost } from "./sharedHost";
import type { PollingBot } from "./dispatcherTypes";
import type { RunnerConfig } from "../runnerConfig";

/** Имитирует протокол настоящим дочерним процессом без Python, Telegram и Redis. */
const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});
const out=x=>console.log(JSON.stringify({type:'process',pid:process.pid,...x}));
let old;
rl.on('line',line=>{const x=JSON.parse(line);
if(x.cmd==='init')out({event:'ready'});
if(x.cmd==='shutdown')process.exit(0);
if(x.cmd==='stop'){old=x;out({...x,event:'exited',code:0});}
if(x.cmd==='start'){
if(old){out({...old,event:'ready'});out({...old,event:'exited',code:1});old=undefined;}
if(x.token_id===3)out({...x,type:'stdout',content:'waiting'});
else out({event:'ready',token_id:x.token_id,activation_id:x.activation_id});
if(x.token_id===99)setTimeout(()=>process.exit(7),50);
}});`;

/** Создаёт независимую несекретную регистрацию. */
function bot(tokenId: number): PollingBot {
  return { tokenId, token: "fake", botFile: "fake.py", env: {}, projectId: 1,
    idleTimeout: 30, workerKey: "test", instance: "test" };
}

/** Подменяет только команду интерпретатора, сохраняя настоящий транспорт и поколения. */
function host(onEvent: (event: Record<string, unknown>) => void = () => {}) {
  return new SharedPollingHost({} as RunnerConfig, onEvent, () => {}, {
    command: process.execPath, args: ["-e", fixture], env: process.env,
  });
}

test("поздний выход старой активации не завершает повторно запущенного бота", async () => {
  const shared = host();
  try {
    const neighbor = await shared.start(bot(2), new AbortController().signal);
    const first = await shared.start(bot(1), new AbortController().signal);
    await first.stop();
    const next = await shared.start(bot(1), new AbortController().signal);
    assert.equal(next.actualPid, neighbor.actualPid);
    assert.equal(shared.counters().activeHandlers, 2);
    assert.deepEqual(shared.counters().handlerTokenIds.sort(), [1, 2]);
    await next.stop();
    assert.equal(shared.counters().activeHandlers, 1);
    await neighbor.stop();
  } finally { await shared.shutdown(); }
});

test("отмена отправленного запуска выгружает только его, сохраняя активного соседа", async () => {
  let waiting!: () => void;
  const issued = new Promise<void>(resolve => { waiting = resolve; });
  const shared = host(event => { if (event.type === "stdout") waiting(); });
  try {
    const neighbor = await shared.start(bot(2), new AbortController().signal);
    const controller = new AbortController();
    const starting = shared.start(bot(3), controller.signal);
    const rejected = assert.rejects(starting, /отменён/);
    await issued;
    controller.abort();
    await rejected;
    assert.deepEqual(shared.counters().handlerTokenIds, [2]);
    assert.equal(shared.counters().actualPid, neighbor.actualPid);
    await neighbor.stop();
  } finally { await shared.shutdown(); }
});

test("авария общего PID завершает всех соседей и допускает чистый повторный запуск", async () => {
  const shared = host();
  try {
    const first = await shared.start(bot(1), new AbortController().signal);
    const crashedPid = first.actualPid;
    const crashing = await shared.start(bot(99), new AbortController().signal);
    const results = await Promise.all([first.done, crashing.done]);
    assert.ok(results.every(result => result.code === 7));
    assert.equal(shared.counters().activeHandlers, 0);
    assert.equal(shared.counters().memoryKb, 0);
    const recovered = await shared.start(bot(1), new AbortController().signal);
    assert.notEqual(recovered.actualPid, crashedPid);
    assert.deepEqual(shared.counters().handlerTokenIds, [1]);
    await recovered.stop();
  } finally { await shared.shutdown(); }
});
