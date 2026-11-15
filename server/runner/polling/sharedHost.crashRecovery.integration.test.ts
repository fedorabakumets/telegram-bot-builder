/** @fileoverview Проверяет аварии общего процесса двух постоянных ботов и границы штатной остановки. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SharedPollingHost } from "./sharedHost";
import type { RunnerConfig } from "../runnerConfig";
import { isBotDiagnosticError, parseWorkerHostCrash } from "../../bots/workerBotDiagnostics";
import { isInfrastructureHostCrash, resolveWorkerExitError } from "../../bots/workerExitDiagnostic";

/** Имитирует общий интерпретатор настоящим процессом без Telegram, Redis и секретов. */
const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});
const out=x=>console.log(JSON.stringify(x));
rl.on('line',line=>{const x=JSON.parse(line);
if(x.cmd==='init')out({type:'process',event:'ready',pid:process.pid});
if(x.cmd==='start_bot')out({type:'system',content:'bot_started:'+x.token_id});
if(x.cmd==='stop_bot')out({type:'system',content:'bot_stopped:'+x.token_id});
if(x.cmd==='warn')out({type:'stderr',token_id:x.token_id,content:'WARNING DeepLink fallback'});
if(x.cmd==='spoof')out({type:'worker_host_crash',token_id:999,exit_code:7,signal:null});
if(x.cmd==='crash')setTimeout(()=>process.exit(7),10);
if(x.cmd==='signal')setTimeout(()=>process.kill(process.pid,'SIGTERM'),10);
if(x.cmd==='shutdown')process.exit(0);});`;

/** Возвращает хост и обещание единственного сообщения о незапланированной аварии. */
function scenario() {
  const events: Record<string, unknown>[] = [];
  let notify!: (result: { code: number | null; signal: string | null }) => void;
  const crashed = new Promise<{ code: number | null; signal: string | null }>(resolve => { notify = resolve; });
  const shared = new SharedPollingHost({ pythonHost: "unified" } as RunnerConfig,
    event => events.push(event), () => {}, { command: process.execPath, args: ["-e", fixture], env: process.env });
  shared.onPermanentCrash = result => notify(result);
  return { shared, events, crashed };
}

test("авария двух постоянных ботов сохраняет код и не превращает старый warning в причину", { timeout: 10_000 }, async () => {
  const { shared, events, crashed } = scenario();
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 5, token: "exchange-secret" });
    await shared.sendPermanent({ cmd: "start_bot", token_id: 11, token: "router-secret" });
    const oldPid = shared.counters().actualPid;
    await shared.sendPermanent({ cmd: "spoof" });
    await shared.sendPermanent({ cmd: "warn", token_id: 5 });
    await shared.sendPermanent({ cmd: "crash" });
    assert.deepEqual(await crashed, { code: 7, signal: null });
    const failures = events.filter(event => event.type === "worker_host_crash");
    assert.deepEqual(failures.map(event => event.token_id).sort((a, b) => Number(a) - Number(b)), [5, 11]);
    assert.equal(events.some(event => event.type === "worker_host_crash" && event.token_id === 999), false);
    for (const event of failures) {
      assert.equal(event.exit_code, 7);
      assert.equal(event.signal, null);
      assert.equal(event.pid, oldPid);
      assert.equal(JSON.stringify(event).includes("DeepLink"), false);
      const reason = parseWorkerHostCrash({ ...event, type: String(event.type) });
      assert.ok(reason);
      assert.equal(isBotDiagnosticError("WARNING DeepLink fallback"), false);
      assert.equal(isInfrastructureHostCrash(reason, true), true);
      assert.equal(isInfrastructureHostCrash(reason, false), false);
      assert.equal(resolveWorkerExitError("error", reason, true), reason);
      assert.equal(reason.includes("Ошибка запуска"), false);
      const exit = events.findIndex(item => item.type === "system" && item.content === `bot_exited:${event.token_id}:error`);
      assert.ok(exit > events.indexOf(event), "диагноз аварии приходит раньше завершения бота");
    }
    assert.deepEqual(shared.counters().permanentTokenIds, []);
    await shared.sendPermanent({ cmd: "start_bot", token_id: 11, token: "router-secret" });
    assert.notEqual(shared.counters().actualPid, oldPid);
    assert.equal(failures.some(event => JSON.stringify(event).includes("router-secret")), false);
  } finally { await shared.shutdown(); }
});

test("штатно остановленный бот не становится участником последующей аварии соседа", { timeout: 10_000 }, async () => {
  const { shared, events, crashed } = scenario();
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 5, token: "exchange-secret" });
    await shared.sendPermanent({ cmd: "start_bot", token_id: 11, token: "router-secret" });
    await shared.stopPermanent(5);
    await shared.sendPermanent({ cmd: "crash" });
    await crashed;
    assert.deepEqual(events.filter(event => event.type === "worker_host_crash").map(event => event.token_id), [11]);
    assert.equal(events.some(event => event.content === "bot_exited:5:error"), false);
  } finally { await shared.shutdown(); }
});

test("штатное завершение всей группы не создаёт инфраструктурную аварию", { timeout: 10_000 }, async () => {
  const { shared, events } = scenario();
  await shared.sendPermanent({ cmd: "start_bot", token_id: 5, token: "exchange-secret" });
  await shared.sendPermanent({ cmd: "start_bot", token_id: 11, token: "router-secret" });
  await shared.shutdown();
  assert.equal(events.some(event => event.type === "worker_host_crash"), false);
});

test("сигнал завершения общего процесса сохраняется без подмены на код 1", {
  timeout: 10_000, skip: process.platform === "win32" ? "Проверка POSIX-сигнала выполняется на Linux" : false,
}, async () => {
  const { shared, events, crashed } = scenario();
  try {
    await shared.sendPermanent({ cmd: "start_bot", token_id: 5, token: "exchange-secret" });
    await shared.sendPermanent({ cmd: "start_bot", token_id: 11, token: "router-secret" });
    await shared.sendPermanent({ cmd: "signal" });
    assert.deepEqual(await crashed, { code: null, signal: "SIGTERM" });
    for (const event of events.filter(item => item.type === "worker_host_crash")) {
      assert.equal(event.exit_code, null);
      assert.equal(event.signal, "SIGTERM");
    }
  } finally { await shared.shutdown(); }
});
