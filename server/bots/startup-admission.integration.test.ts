/** @fileoverview Совместная проверка очереди запусков, отмены намерения и действующего допуска памяти. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { acquireBotStartupSlot } from './acquireBotStartupSlot';
import { cancelBotStart, getBotStartRevision } from './botStartState';
import { resetServerShutdownState } from './serverShutdownState';
import { MemoryAdmission, MemoryPressureError } from '../runner/polling/memoryAdmission';

// Монотонные часы модуля привязаны к управляемому времени интеграционного теста.
vi.mock('node:perf_hooks', () => ({ performance: { now: () => Date.now() } }));

let clockBase = 0;
beforeEach(() => {
  // Ограничитель использует монотонное время, поэтому подменяем и performance.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
  clockBase += 10_000; vi.setSystemTime(clockBase); resetServerShutdownState();
});
afterEach(async () => { await vi.runAllTimersAsync(); vi.useRealTimers(); resetServerShutdownState(); });

it('допускает пять запусков одного проекта и выдерживает 250мс между началами глобально', async () => {
  const starts: Array<{ project: number; at: number }> = [];
  const finishes: Array<{ project: number; at: number }> = [];
  let active = 0, maximum = 0, sameProject = 0, maximumSameProject = 0;
  const projects = [1, 1, 1, 1, 1, 2, 3, 2, 4];
  const tasks = projects.map(async (project, index) => {
    const tokenId = 9000 + index;
    const release = await acquireBotStartupSlot(project, tokenId, getBotStartRevision(tokenId));
    expect(release).toBeTypeOf('function');
    active++; maximum = Math.max(maximum, active);
    if (project === 1) { sameProject++; maximumSameProject = Math.max(maximumSameProject, sameProject); }
    starts.push({ project, at: Date.now() });
    try { await new Promise<void>(resolve => setTimeout(resolve, 1500)); }
    finally {
      finishes.push({ project, at: Date.now() });
      active--; if (project === 1) sameProject--; release?.();
    }
  });
  await vi.runAllTimersAsync();
  await Promise.all(tasks);
  expect(maximum).toBe(5);
  expect(maximumSameProject).toBe(5);
  expect(starts.map(item => item.project)).toEqual(projects);
  for (let index = 1; index < starts.length; index++)
    expect(starts[index].at - starts[index - 1].at).toBeGreaterThanOrEqual(250);
  // Второй запуск одного проекта начинается до завершения первого.
  expect(starts[1].at).toBeLessThan(finishes[0].at);
  // Освободившееся место используется сразу: новой паузы от завершения нет.
  expect(starts[5].at).toBe(finishes[0].at);
});

it('ручная отмена ожидающего запуска не доходит до допуска памяти и освобождает место', async () => {
  const holdersPending = Promise.all([11, 12, 13, 14, 15].map((project, index) =>
    acquireBotStartupSlot(project, 9100 + index, getBotStartRevision(9100 + index))));
  await vi.advanceTimersByTimeAsync(1000);
  const holders = await holdersPending;
  const tokenId = 9199;
  const memoryRead = vi.fn(async () => ({ currentBytes: 0, limitBytes: 1024 ** 3 }));
  const memory = new MemoryAdmission(memoryRead);
  const waiting = acquireBotStartupSlot(16, tokenId, getBotStartRevision(tokenId));
  cancelBotStart(tokenId);
  holders[0]?.();
  await vi.advanceTimersByTimeAsync(250);
  const canceled = await waiting;
  if (canceled) { (await memory.acquire()).release(); canceled(); }
  expect(canceled).toBeUndefined();
  expect(memoryRead).not.toHaveBeenCalled();
  const freshPending = acquireBotStartupSlot(17, 9200, getBotStartRevision(9200));
  await vi.advanceTimersByTimeAsync(250);
  const fresh = await freshPending;
  expect(fresh).toBeTypeOf('function');
  fresh?.(); holders.slice(1).forEach(release => release?.());
});

it('глобальное место не обходит отказ памяти и освобождается для другого проекта', async () => {
  const release = await acquireBotStartupSlot(21, 9300, getBotStartRevision(9300));
  const memory = new MemoryAdmission(async () => ({ currentBytes: 1000 * 1024 ** 2,
    limitBytes: 1024 ** 3 }));
  let spawned = false;
  try {
    await expect((async () => { const reservation = await memory.acquire();
      spawned = true; reservation.release(); })()).rejects.toBeInstanceOf(MemoryPressureError);
  } finally { release?.(); }
  expect(spawned).toBe(false);
  const nextPending = acquireBotStartupSlot(22, 9301, getBotStartRevision(9301));
  await vi.advanceTimersByTimeAsync(250);
  const next = await nextPending;
  expect(next).toBeTypeOf('function'); next?.();
});

it('настоящий startBot использует общий допуск до побочных эффектов и освобождает в finally', () => {
  const source = readFileSync(new URL('./startBot.ts', import.meta.url), 'utf8');
  const acquire = source.indexOf('await acquireBotStartupSlot(');
  expect(acquire).toBeGreaterThan(0);
  expect(acquire).toBeLessThan(source.indexOf("await resolveBotCommandFence(tokenId, 'start')"));
  expect(source.lastIndexOf('releaseStartupSlot?.()')).toBeGreaterThan(source.lastIndexOf('finally'));
});
