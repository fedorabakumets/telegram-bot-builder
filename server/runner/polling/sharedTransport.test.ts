/** @fileoverview Проверка служебных идентификаторов при совпадении с короткими секретами. */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SharedPythonTransport } from "./sharedTransport";

test("очистка секретов не меняет идентификатор известной активации и события протокола", async () => {
  const events: Record<string, unknown>[] = [];
  const script = `const rl=require('node:readline').createInterface({input:process.stdin});
    rl.on('line',line=>{const x=JSON.parse(line);if(x.cmd==='shutdown')process.exit(0);
    console.log(JSON.stringify({type:'process',event:'ready',pid:process.pid,
    ...(x.cmd==='start'?{activation_id:x.activation_id,token_id:33,content:'1234567890 ready secret-token'}:{})}));});`;
  let received!: () => void;
  const seen = new Promise<void>(resolve => { received = resolve; });
  const directory = await mkdtemp(join(tmpdir(), "tbb-protocol-"));
  const fixture = join(directory, "worker.cjs");
  await writeFile(fixture, script);
  const transport = new SharedPythonTransport({ command: process.execPath, args: [fixture], env: process.env,
    onEvent: event => { events.push(event); if (event.token_id === 33) received(); } });
  const activation = "12345678-9012-4111-8111-123456789012";
  try {
    await transport.ready;
    await transport.send({ cmd: "start", activation_id: activation, token: "secret-token",
      env: { TOKEN_ID: "1234567890", API_SECRET: "ready" } });
    await seen;
    const event = events.find(item => item.token_id === 33)!;
    assert.equal(event.activation_id, activation);
    assert.equal(event.type, "process");
    assert.equal(event.event, "ready");
    assert.equal(event.content, "[скрыто] [скрыто] [скрыто]");
  } finally { await transport.shutdown(); await unlink(fixture); await rmdir(directory); }
});
