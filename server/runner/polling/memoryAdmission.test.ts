/** @fileoverview Проверки контейнерного допуска, параллельных запусков и сохранения работающего хоста. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryAdmission, MemoryPressureError } from "./memoryAdmission";
import { PermanentMemory } from "./permanentMemory";
import { SharedPollingHost } from "./sharedHost";
import type { RunnerConfig } from "../runnerConfig";
import type { PollingBot } from "./dispatcherTypes";

const MB = 1024 * 1024;
/** Известный лимит и фиксированная оценка для воспроизводимого теста. */
const env = { RUNNER_MEMORY_START_MB: "64", RUNNER_MEMORY_HEADROOM_MB: "64" };

test("при нехватке cgroup места отказ не выделяет резерв", async () => {
  let current = 400 * MB;
  const gate = new MemoryAdmission(async () => ({ currentBytes: current, limitBytes: 500 * MB }), env);
  await assert.rejects(gate.acquire(), MemoryPressureError);
  current = 200 * MB;
  const reservation = await gate.acquire(); reservation.release(); reservation.release();
});

test("параллельные старты разделяют ещё не измеренный пик и освобождают его после отказа", async () => {
  const gate = new MemoryAdmission(async () => ({ currentBytes: 300 * MB, limitBytes: 500 * MB }), env);
  const results = await Promise.allSettled([gate.acquire(), gate.acquire()]);
  assert.equal(results.filter(item => item.status === "fulfilled").length, 1);
  const first = results[0]; assert.equal(first.status, "fulfilled");
  if (first.status !== "fulfilled") return;
  first.value.settled();
  await assert.rejects(gate.acquire(), MemoryPressureError);
  first.value.release();
  (await gate.acquire()).release();
});

test("отсутствие конечного лимита сохраняет работу без ложного отказа", async () => {
  for (const snapshot of [null, { currentBytes: 999 * MB, limitBytes: null }]) {
    const gate = new MemoryAdmission(async () => snapshot, env);
    (await gate.acquire()).release();
  }
});

test("отказ постоянного запуска передаёт launch_id и не трогает соседние резервы", async () => {
  const memory = new PermanentMemory(), events: Record<string, unknown>[] = [];
  const gate = new MemoryAdmission(async () => ({ currentBytes: 450 * MB, limitBytes: 500 * MB }), env);
  await assert.rejects(memory.acquire({ token_id: 45, env: { BOT_LAUNCH_ID: "17" } }, gate, event => events.push(event)));
  assert.equal(events[0].code, "memory_pressure"); assert.equal(events[0].launch_id, 17);
  assert.equal(events[0].source, "runner_memory");
});

test("отклонённая активация не создаёт процесс общего хоста", async () => {
  const gate = new MemoryAdmission(async () => ({ currentBytes: 450 * MB, limitBytes: 500 * MB }), env);
  const host = new SharedPollingHost({} as RunnerConfig, () => {}, () => {}, undefined, gate);
  const bot = { tokenId: 45, token: "fake", botFile: "fake", env: {} } as PollingBot;
  await assert.rejects(host.start(bot, new AbortController().signal), MemoryPressureError);
  assert.equal(host.counters().pid, undefined); assert.equal(host.counters().activeHandlers, 0);
  await host.shutdown();
});

test("отказ новому сценарию сохраняет процесс и активного соседа", async () => {
  let current = 100 * MB;
  const gate = new MemoryAdmission(async () => ({ currentBytes: current, limitBytes: 500 * MB }), env);
  const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});
    const out=x=>console.log(JSON.stringify({type:'process',pid:process.pid,...x}));
    rl.on('line',l=>{const x=JSON.parse(l);if(x.cmd==='init')out({event:'ready'});
    if(x.cmd==='shutdown')process.exit(0);
    if(x.cmd==='start')out({event:'ready',token_id:x.token_id,activation_id:x.activation_id});
    if(x.cmd==='stop')out({event:'exited',code:0,token_id:x.token_id,activation_id:x.activation_id});});`;
  const host = new SharedPollingHost({} as RunnerConfig, () => {}, () => {},
    { command: process.execPath, args: ["-e", fixture], env: process.env }, gate);
  const bot = { tokenId: 1, token: "fake", botFile: "fake", env: {} } as PollingBot;
  try {
    const first = await host.start(bot, new AbortController().signal);
    const pid = host.counters().pid;
    current = 450 * MB;
    await assert.rejects(host.start({ ...bot, tokenId: 2 }, new AbortController().signal), MemoryPressureError);
    assert.equal(host.counters().pid, pid); assert.equal(host.counters().activeHandlers, 1);
    await first.stop();
  } finally { await host.shutdown(); }
});
