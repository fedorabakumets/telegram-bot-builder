/** @fileoverview Доставка доверенной ошибки общего Python для постоянных и временных сценариев. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SharedPollingHost } from "./sharedHost";
import type { RunnerConfig } from "../runnerConfig";
import type { PollingBot } from "./dispatcherTypes";

/** Двойник протокола Python отправляет структурированную ошибку только внутри известного запуска. */
const script = `const rl=require('node:readline').createInterface({input:process.stdin});
const out=x=>console.log(JSON.stringify(x));
rl.on('line',l=>{const x=JSON.parse(l);
if(x.cmd==='init')out({type:'process',event:'ready',pid:process.pid});
if(x.cmd==='shutdown')process.exit(0);
if(x.cmd==='start'||x.cmd==='start_bot'){
out(x.cmd==='start'?{type:'process',event:'ready',pid:process.pid,token_id:x.token_id,activation_id:x.activation_id}:{type:'system',content:'bot_started:'+x.token_id});
out({type:'bot_runtime_error',token_id:x.token_id,activation_id:x.activation_id,launch_id:123,code:'telegram_frozen',source:'telegram_bot_api',method:'sendMessage',tokenFingerprint:'a'.repeat(64)});
}
if(x.cmd==='stop')out({type:'process',event:'exited',code:0,token_id:x.token_id,activation_id:x.activation_id});
if(x.cmd==='stop_bot')out({type:'system',content:'bot_stopped:'+x.token_id});
});`;

test("единый Python сохраняет источник ошибки временного и постоянного бота", async () => {
  const events: Record<string, unknown>[] = [];
  const host = new SharedPollingHost({ pythonHost: "unified" } as RunnerConfig, event => { events.push(event); }, () => {},
    { command: process.execPath, args: ["-e", script], env: process.env });
  const bot: PollingBot = { tokenId: 58, token: "12345:fake", botFile: "unused.py", env: { BOT_LAUNCH_ID: "123" },
    projectId: 12, idleTimeout: 1, workerKey: "0", instance: "i" };
  try {
    const child = await host.start(bot, new AbortController().signal);
    await host.sendPermanent({ cmd: "start_bot", token_id: 59 });
    const deadline = Date.now() + 3000;
    while (events.filter(event => event.type === "bot_runtime_error").length < 2 && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 10));
    const failures = events.filter(event => event.type === "bot_runtime_error");
    assert.deepEqual(failures.map(event => event.token_id), [58, 59]);
    assert.ok(failures[0].activation_id);
    assert.equal(failures[1].activation_id, undefined);
    assert.ok(failures.every(event => event.launch_id === 123 && event.method === "sendMessage"));
    await child.stop(); await host.stopPermanent(59);
  } finally { await host.shutdown(); }
});
