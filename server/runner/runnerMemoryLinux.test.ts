/** @fileoverview Проверки единиц памяти, дерева процессов и недоступных показателей Linux. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMemoryFields, readContainerMemory, readProcessMemory } from "./runnerMemoryLinux";

test("Переводит kB в байты, сохраняя PPid и счётчики без единиц", () => {
  assert.deepEqual(parseMemoryFields("Rss: 12 kB\nPPid:\t1\nfile 123\nName: python\n"),
    { Rss: 12288, PPid: 1, file: 123 });
});

test("Считает только дерево исполнителя, различает RSS/PSS и недоступный rollup", async () => {
  const root = await mkdtemp(join(tmpdir(), "memory-proc-"));
  try {
    for (const [pid, parent] of [[10, 1], [20, 10], [30, 20], [40, 1]]) {
      await mkdir(join(root, String(pid)));
      await writeFile(join(root, String(pid), "status"), `Name:\tprocess\nPPid:\t${parent}\nVmRSS: 50 kB\n`);
    }
    await writeFile(join(root, "10", "smaps_rollup"),
      "Rss: 100 kB\nPss: 80 kB\nAnonymous: 60 kB\nPrivate_Clean: 5 kB\nPrivate_Dirty: 60 kB\n");
    const result = await readProcessMemory(10, root);
    assert.equal(result.available, true);
    assert.deepEqual(result.processes.map(({ pid }) => pid).sort(), [10, 20, 30]);
    assert.equal(result.processes.find(({ pid }) => pid === 10)?.privateBytes, 65 * 1024);
    assert.equal(result.processes.find(({ pid }) => pid === 10)?.pssBytes, 80 * 1024);
    assert.equal(result.processes.find(({ pid }) => pid === 20)?.pssBytes, null);
    assert.equal(result.processes.find(({ pid }) => pid === 20)?.rssBytes, 50 * 1024);
    assert.equal((await readProcessMemory(999, root)).available, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Читает вложенный cgroup v2 и не суммирует перекрывающиеся категории", async () => {
  const root = await mkdtemp(join(tmpdir(), "memory-cgroup-"));
  try {
    await mkdir(join(root, "proc", "self"), { recursive: true });
    await mkdir(join(root, "cg", "service"), { recursive: true });
    await writeFile(join(root, "proc", "self", "cgroup"), "0::/service\n");
    await writeFile(join(root, "cg", "service", "memory.current"), "1000\n");
    await writeFile(join(root, "cg", "service", "memory.max"), "max\n");
    await writeFile(join(root, "cg", "service", "memory.stat"), "anon 600\nfile 300\nfile_mapped 200\n");
    const result = await readContainerMemory(join(root, "proc"), join(root, "cg"));
    assert.equal(result?.currentBytes, 1000);
    assert.equal(result?.anonBytes, 600);
    assert.equal(result?.fileMappedBytes, 200);
    assert.equal(result?.limitBytes, null);
    assert.equal(result?.kernelBytes, null);
    assert.equal(await readContainerMemory(root, join(root, "absent")), null);
  } finally { await rm(root, { recursive: true, force: true }); }
});
