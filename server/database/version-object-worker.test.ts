/**
 * @fileoverview Проверки адаптивной обработки очереди снимков и миграций S3.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Подмены очереди позволяют проверять планировщик без PostgreSQL и S3. */
const mocks = vi.hoisted(() => ({
  pending: vi.fn(), deletions: vi.fn(), settings: vi.fn(), reconcile: vi.fn(),
  requested: vi.fn(), enqueue: vi.fn(), finish: vi.fn(),
}));
vi.mock('./version-object-store', () => ({
  processPendingVersions: mocks.pending, processVersionObjectDeletions: mocks.deletions,
}));
vi.mock('./version-storage-settings', () => ({ getVersionStorageSettings: mocks.settings }));
vi.mock('./version-object-reconcile-all', () => ({ reconcileAllVersionObjects: mocks.reconcile }));
vi.mock('./version-storage-migration', () => ({
  isVersionMigrationRequested: mocks.requested, enqueueVersionMigrationBatch: mocks.enqueue,
  finishVersionMigration: mocks.finish,
}));

describe('планировщик снимков версий', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.resetAllMocks();
    mocks.settings.mockResolvedValue({ mode: 's3', storageId: 'private' });
    mocks.pending.mockResolvedValue(0);
    mocks.deletions.mockResolvedValue(0);
    mocks.requested.mockResolvedValue(false);
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  it('ограничивает паузу пустой очереди и возвращается к 2 секундам после работы', async () => {
    const worker = await import('./version-object-worker');
    worker.startVersionObjectWorker();
    await vi.advanceTimersByTimeAsync(58_000);
    expect(mocks.pending).toHaveBeenCalledTimes(5);
    mocks.deletions.mockResolvedValueOnce(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.pending).toHaveBeenCalledTimes(6);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(mocks.pending).toHaveBeenCalledTimes(7);
  });

  it('продолжает миграцию через 2 секунды и завершает её только после пустой партии', async () => {
    mocks.requested.mockResolvedValue(true);
    mocks.enqueue.mockResolvedValueOnce(100).mockResolvedValue(0);
    const worker = await import('./version-object-worker');
    worker.startVersionObjectWorker();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.finish).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(mocks.enqueue).toHaveBeenCalledTimes(2);
    expect(mocks.finish).toHaveBeenCalledTimes(1);
  });

  it('не дублирует запуск и не накладывает циклы при медленной загрузке', async () => {
    let complete!: (count: number) => void;
    mocks.pending.mockImplementationOnce(() => new Promise<number>(resolve => { complete = resolve; }));
    const worker = await import('./version-object-worker');
    worker.startVersionObjectWorker();
    worker.startVersionObjectWorker();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.pending).toHaveBeenCalledTimes(1);
    complete(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(mocks.pending).toHaveBeenCalledTimes(2);
  });
});
