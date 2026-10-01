/**
 * @fileoverview Тесты канала до воркера: разбиение stdout на строки и дочерний процесс
 * @module server/bots/workerChannel.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { LineSplitter } from "./workerChannel";
import { LocalWorkerChannel } from "./localWorkerChannel";

describe("LineSplitter", () => {
  it("склеивает строку, разорванную между кусками", () => {
    const splitter = new LineSplitter();
    assert.deepStrictEqual(splitter.push('{"a":'), []);
    assert.deepStrictEqual(splitter.push('1}\n{"b":2}\n\n{"c"'), ['{"a":1}', '{"b":2}']);
    assert.deepStrictEqual(splitter.push(":3}\n"), ['{"c":3}']);
  });
});

describe("LocalWorkerChannel", () => {
  it("отправляет строку в stdin и получает ответ и код выхода", async () => {
    const script = "process.stdin.once('data', (d) => { console.log('echo:' + d.toString().trim()); process.exit(3); });";
    const channel = new LocalWorkerChannel({ command: process.execPath, args: ["-e", script], env: process.env });
    const lines: string[] = [];
    channel.on("line", (line: string) => lines.push(line));
    const exited = new Promise<number | null>((resolve) => channel.once("exit", (code: number | null) => resolve(code)));
    assert.ok(channel.pid);
    assert.strictEqual(channel.send('{"cmd":"status"}'), true);
    assert.strictEqual(await exited, 3);
    assert.deepStrictEqual(lines, ['echo:{"cmd":"status"}']);
  });

  it("kill завершает процесс", async () => {
    const channel = new LocalWorkerChannel({ command: process.execPath, args: ["-e", "setInterval(() => {}, 1000)"], env: process.env });
    const exited = new Promise<string | null>((resolve) => channel.once("exit", (_c: number | null, signal: string | null) => resolve(signal)));
    channel.kill();
    assert.strictEqual(await exited, "SIGKILL");
  });
});
