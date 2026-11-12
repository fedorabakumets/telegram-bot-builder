/** @fileoverview Чтение памяти процессов и контейнера Linux без запуска сторонних программ. */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Разбирает именованные значения ядра, переводя килобайты в байты.
 * @param text - Текст status, smaps_rollup или memory.stat
 * @returns Числовые поля без строковых значений
 */
export function parseMemoryFields(text: string): Record<string, number> {
  const fields: Record<string, number> = {};
  for (const line of text.split("\n")) {
    const match = /^(\w+):?\s+(\d+)(?:\s+(kB))?\s*$/.exec(line);
    if (match) fields[match[1]] = Number(match[2]) * (match[3] ? 1024 : 1);
  }
  return fields;
}

/**
 * Читает файл, сохраняя недоступность измерения вместо подстановки нуля.
 * @param path - Путь к файлу ядра
 * @returns Текст или null при отсутствии доступа
 */
async function optionalText(path: string): Promise<string | null> {
  return readFile(path, "utf8").catch(() => null);
}

/**
 * Возвращает собственную память процесса и всех его потомков.
 * @param rootPid - PID исполнителя
 * @param procRoot - Корень procfs, подменяемый в тестах
 * @returns Снимки процессов; исчезнувшие процессы не превращаются в нулевое потребление
 */
export async function readProcessMemory(rootPid: number, procRoot = "/proc") {
  const entries = await readdir(procRoot).catch(() => [] as string[]);
  const statuses = [];
  for (const entry of entries.filter((name) => /^\d+$/.test(name))) {
    const text = await optionalText(join(procRoot, entry, "status"));
    if (text) statuses.push({ pid: Number(entry), fields: parseMemoryFields(text),
      name: /^Name:\s*(.+)$/m.exec(text)?.[1] ?? "unknown" });
  }
  const descendants = new Set([rootPid]);
  let previous = 0;
  while (previous !== descendants.size) {
    previous = descendants.size;
    for (const item of statuses) if (descendants.has(item.fields.PPid)) descendants.add(item.pid);
  }
  const processes = [];
  for (const item of statuses.filter(({ pid }) => descendants.has(pid))) {
    const rollup = await optionalText(join(procRoot, String(item.pid), "smaps_rollup"));
    const fields = rollup === null ? null : parseMemoryFields(rollup);
    processes.push({ pid: item.pid, parentPid: item.fields.PPid, name: item.name,
      rssBytes: fields?.Rss ?? item.fields.VmRSS ?? null, pssBytes: fields?.Pss ?? null,
      anonymousBytes: fields?.Anonymous ?? null,
      privateBytes: fields && "Private_Clean" in fields && "Private_Dirty" in fields
        ? fields.Private_Clean + fields.Private_Dirty : null,
      privateCleanBytes: fields?.Private_Clean ?? null, privateDirtyBytes: fields?.Private_Dirty ?? null,
      rollupAvailable: fields !== null });
  }
  return { available: processes.some(({ pid }) => pid === rootPid), processes };
}

/**
 * Читает cgroup v2 с учётом вложенной группы и изолированного пространства имён.
 * @param procRoot - Корень procfs
 * @param cgroupRoot - Точка монтирования cgroup v2
 * @returns Общий расход контейнера и перекрывающиеся составляющие в байтах либо null
 */
export async function readContainerMemory(procRoot = "/proc", cgroupRoot = "/sys/fs/cgroup") {
  const membership = await optionalText(join(procRoot, "self", "cgroup"));
  const relative = /^0::\/(.*)$/m.exec(membership ?? "")?.[1];
  const roots = relative && !relative.split("/").includes("..")
    ? [join(cgroupRoot, relative), cgroupRoot] : [cgroupRoot];
  for (const root of roots) {
    const current = await optionalText(join(root, "memory.current"));
    if (current === null || !/^\d+\s*$/.test(current)) continue;
    const stat = parseMemoryFields(await optionalText(join(root, "memory.stat")) ?? "");
    const limit = await optionalText(join(root, "memory.max"));
    return { currentBytes: Number(current.trim()), limitBytes: /^\d+\s*$/.test(limit ?? "") ? Number(limit) : null,
      anonBytes: stat.anon ?? null, fileBytes: stat.file ?? null, kernelBytes: stat.kernel ?? null,
      shmemBytes: stat.shmem ?? null, fileMappedBytes: stat.file_mapped ?? null,
      inactiveFileBytes: stat.inactive_file ?? null, activeFileBytes: stat.active_file ?? null };
  }
  return null;
}
