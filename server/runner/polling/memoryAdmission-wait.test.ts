/** @fileoverview Ожидание временного стартового резерва без отключения защиты памяти. */
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryAdmission, MemoryPressureError } from './memoryAdmission';

/** Размер фиксированного стартового пика в байтах. */
const START = 64 * 1024 * 1024;
afterEach(() => vi.useRealTimers());

it('запускает после освобождения резерва при показателях рабочего отказа TorLink', async () => {
  vi.useFakeTimers();
  const gate = new MemoryAdmission(async () => ({ currentBytes: 768679936, limitBytes: 999997440 }), {});
  const first = await gate.acquire();
  first.settled();
  const ready = vi.fn();
  const waiting = gate.acquire().then(reservation => { ready(); return reservation; });
  await vi.advanceTimersByTimeAsync(9_750);
  expect(ready).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(250);
  (await waiting).release();
  expect(ready).toHaveBeenCalledOnce();
});

it('отказывает сразу при реальной нехватке памяти без временного резерва', async () => {
  const gate = new MemoryAdmission(async () => ({ currentBytes: 850000000, limitBytes: 999997440 }), {});
  await expect(gate.acquire()).rejects.toBeInstanceOf(MemoryPressureError);
});

it('ограничивает ожидание зависшего запуска и сохраняет его резерв', async () => {
  vi.useFakeTimers();
  const gate = new MemoryAdmission(async () => ({ currentBytes: 768679936, limitBytes: 999997440 }), {});
  const first = await gate.acquire();
  const outcome = gate.acquire().catch(error => error);
  await vi.advanceTimersByTimeAsync(12_000);
  expect(await outcome).toMatchObject({ code: 'memory_pressure', diagnostics: { reservedBytes: START } });
  first.release();
  (await gate.acquire()).release();
});
