/**
 * @fileoverview Тесты канала до воркера: разбиение stdout на строки и дочерний процесс
 * @module server/bots/workerChannel.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { LineSplitter } from "./workerChannel";
import { LocalWorkerChannel } from "./localWorkerChannel";

describe("LineSplitter", () => {
  it("сохраняет длинный JSON из маленьких фрагментов и очищает счётчик", () => {
    const splitter = new LineSplitter();
    const text = JSON.stringify({ value: "я".repeat(200_000) });
    for (let offset = 0; offset < text.length; offset += 73) {
      assert.deepStrictEqual(splitter.push(text.slice(offset, offset + 73)), []);
    }
    assert.strictEqual(splitter.bufferedBytes, Buffer.byteLength(text));
    assert.deepStrictEqual(splitter.push("\n"), [text]);
    assert.strictEqual(splitter.bufferedBytes, 0);
  });
  it("склеивает строку, разорванную между кусками", () => {
    const splitter = new LineSplitter();
    assert.deepStrictEqual(splitter.push('{"a":'), []);
    assert.deepStrictEqual(splitter.push('1}\n{"b":2}\n\n{"c"'), ['{"a":1}', '{"b":2}']);
    assert.deepStrictEqual(splitter.push(":3}\n"), ['{"c":3}']);
  });
});

describe("LocalWorkerChannel", () => {
  it("отклоняет незавершённую запись при выходе читателя без необработанного EPIPE", { timeout: 5000 }, async () => {
    const channel = new LocalWorkerChannel({ command: process.execPath,
      args: ["-e", "process.stdin.pause();setTimeout(()=>process.exit(),100)"], env: process.env });
    const diagnostics: string[] = [];
    channel.on("stderr", (text: string) => diagnostics.push(text));
    const exited = new Promise<void>((resolve) => channel.once("exit", () => resolve()));
    try {
      await assert.rejects(channel.sendAsync("x".repeat(4 * 1024 * 1024)));
      await exited;
      await new Promise((resolve) => setImmediate(resolve));
      assert.strictEqual(channel.memoryCounters().stdinWritableBytes, 0);
      await assert.rejects(channel.sendAsync("ещё одна команда"), /закрыт/);
    } finally { channel.kill(); }
  });
  it("приостанавливает вывод и после возобновления сохраняет все строки", async () => {
    const script = "setTimeout(()=>{console.log('один');console.log('два');},100);setTimeout(()=>process.exit(),500);";
    const channel = new LocalWorkerChannel({ command: process.execPath, args: ["-e", script], env: process.env });
    const lines: string[] = [];
    channel.on("line", (line: string) => lines.push(line));
    const exited = new Promise<void>((resolve) => channel.once("exit", () => resolve()));
    try {
      channel.pauseOutput(true);
      await new Promise((resolve) => setTimeout(resolve, 250));
      assert.deepStrictEqual(lines, []);
      channel.pauseOutput(false);
      await exited;
      assert.deepStrictEqual(lines, ["один", "два"]);
    } finally { channel.kill(); }
  });
  it("сохраняет UTF-8 при разрыве символа между порциями stdout", async () => {
    const script = "const b=Buffer.from('привет\\n');process.stdout.write(b.subarray(0,1));setTimeout(()=>process.stdout.end(b.subarray(1)),30);";
    const channel = new LocalWorkerChannel({ command: process.execPath, args: ["-e", script], env: process.env });
    const lines: string[] = [];
    channel.on("line", (line: string) => lines.push(line));
    await new Promise<void>((resolve) => channel.once("exit", () => resolve()));
    assert.deepStrictEqual(lines, ["привет"]);
  });

  it("ожидает медленного читателя и доставляет большую команду полностью", async () => {
    const script = "process.stdin.pause();let n=0;process.stdin.on('data',b=>{n+=b.length;if(b.includes(10)){console.log(n);process.exit();}});process.stdin.pause();setTimeout(()=>process.stdin.resume(),200);";
    const channel = new LocalWorkerChannel({ command: process.execPath, args: ["-e", script], env: process.env });
    const lines: string[] = [];
    channel.on("line", (line: string) => lines.push(line));
    const exited = new Promise<void>((resolve) => channel.once("exit", () => resolve()));
    try {
      await channel.sendAsync("x".repeat(2 * 1024 * 1024));
      await exited;
      assert.deepStrictEqual(lines, [String(2 * 1024 * 1024 + 1)]);
    } finally { channel.kill(); }
  });
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
