/** @fileoverview Проверки реального дочернего процесса, отмены и ограничения секретов в каналах запуска. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { startPythonPollingChild } from "./pythonChild";
import { boundedLines, childEnvironment, redactChildLog } from "./pythonChildSupport";

/** Минимальный процесс имитирует протокол Python без Telegram и внешних подключений. */
const fixture = `let tail='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{tail+=s;let i;while((i=tail.indexOf('\\n'))>=0){const x=JSON.parse(tail.slice(0,i));tail=tail.slice(i+1);if(x.cmd==='stop')process.exit(0);else {process.stdout.write(JSON.stringify({type:'process',event:'ready',pid:process.pid,secretInEnv:Boolean(process.env.TELEGRAM_TOKEN||process.env.DATABASE_URL),secretInArgs:process.argv.includes(x.token)})+'\\n');process.stderr.write(x.token+'\\n');}}});`;

test("передаёт секрет stdin, очищает окружение и штатно останавливается", async () => {
  const logs: string[] = [];
  const events: Record<string, unknown>[] = [];
  const token = "123456:very_secret_bot_token_value";
  const child = await startPythonPollingChild({ command: process.execPath, args: ["-e", fixture],
    env: { ...process.env, DATABASE_URL: "postgres://secret", TELEGRAM_TOKEN: token }, init: { token },
    onLog: (text) => logs.push(text), onEvent: (event) => events.push(event), readyTimeoutMs: 2000, stopTimeoutMs: 200 });
  assert.equal(child.actualPid, child.pid);
  assert.equal(events[0].secretInEnv, false);
  assert.equal(events[0].secretInArgs, false);
  await child.stop();
  assert.equal((await child.done).code, 0);
  assert.ok(logs.every((line) => !line.includes(token)));
});

test("запрещает токен в аргументах до запуска", async () => {
  await assert.rejects(startPythonPollingChild({ command: process.execPath, args: ["secret-token"],
    env: process.env, init: { token: "secret-token" } }), /аргументах/);
});

test("таймер готовности принудительно завершает зависший процесс", async () => {
  await assert.rejects(startPythonPollingChild({ command: process.execPath, args: ["-e", "setInterval(()=>{},1000)"],
    env: process.env, init: {}, readyTimeoutMs: 100, stopTimeoutMs: 100 }), /готовности/);
});

test("отмена завершает процесс после готовности", async () => {
  const controller = new AbortController();
  const child = await startPythonPollingChild({ command: process.execPath, args: ["-e", fixture],
    env: process.env, init: {}, signal: controller.signal, readyTimeoutMs: 2000, stopTimeoutMs: 100 });
  controller.abort();
  await child.done;
});

test("недоступный интерпретатор даёт безопасную ошибку", async () => {
  await assert.rejects(startPythonPollingChild({ command: "missing-python-test-473", args: [],
    env: process.env, init: {}, readyTimeoutMs: 200 }), /запустить обработчик/);
});

test("принудительная остановка завершает готовый процесс даже при приостановленном выводе", async () => {
  const script = `process.stdin.resume();process.stdout.write(JSON.stringify({type:'process',event:'ready',pid:process.pid})+'\\n');setInterval(()=>{},1000);`;
  const child = await startPythonPollingChild({ command: process.execPath, args: ["-e", script],
    env: process.env, init: {}, readyTimeoutMs: 2000 });
  child.pauseOutput(true);
  child.kill();
  const exited = await child.done;
  assert.notEqual(exited.code, 0);
});

test("ограничивает незавершённые строки и не наследует секреты", () => {
  const consume = boundedLines(() => {}, 8);
  consume("1234");
  assert.throws(() => consume("56789"), /размер/);
  const env = childEnvironment({ PATH: "bin", PYTHONPATH: "secret", REDIS_URL: "secret", DATABASE_URL: "secret" });
  assert.equal(env.PATH, "bin");
  assert.equal(env.REDIS_URL, undefined);
  assert.equal(env.PYTHONPATH, undefined);
  assert.equal(redactChildLog("redis://user:pass@localhost/0", []), "[подключение скрыто]");
});
