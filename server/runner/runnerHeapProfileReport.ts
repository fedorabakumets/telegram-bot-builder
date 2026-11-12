/** @fileoverview Сводка выборочного профиля V8 по функциям без содержимого объектов. */
import type { HeapProfiler } from "node:inspector";

/** Строка сводки выборочных выделений. */
interface AllocationRow {
  /** Имя функции, в которой выделена память. */
  functionName: string;
  /** Путь скрипта либо URL V8. */
  file: string;
  /** Номер строки, начиная с единицы; null для служебного кадра. */
  line: number | null;
  /** Номер столбца, начиная с единицы; null для служебного кадра. */
  column: number | null;
  /** Оценка собственного объёма выделений, без дочерних вызовов. */
  sampledBytes: number;
}

/**
 * Объединяет повторяющиеся кадры и оставляет крупнейшие места выделений.
 * @param profile - Выборочный профиль V8
 * @returns Оценка объёма и пятнадцать крупнейших мест, без двойного учёта дочерних узлов
 */
export function summarizeHeapProfile(profile: HeapProfiler.SamplingHeapProfile) {
  const rows = new Map<string, AllocationRow>();
  const pending = [profile.head];
  let sampledBytes = 0;
  while (pending.length) {
    const node = pending.pop()!;
    for (const child of node.children) pending.push(child);
    if (!node.selfSize) continue;
    sampledBytes += node.selfSize;
    const frame = node.callFrame;
    const key = JSON.stringify([frame.functionName, frame.url, frame.lineNumber, frame.columnNumber]);
    const row = rows.get(key) ?? { functionName: frame.functionName || "(анонимная функция)",
      file: frame.url, line: frame.lineNumber >= 0 ? frame.lineNumber + 1 : null,
      column: frame.columnNumber >= 0 ? frame.columnNumber + 1 : null, sampledBytes: 0 };
    row.sampledBytes += node.selfSize;
    rows.set(key, row);
  }
  return { sampledBytes, topAllocations: [...rows.values()].sort((a, b) => b.sampledBytes - a.sampledBytes).slice(0, 15) };
}
