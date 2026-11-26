/** @fileoverview Проверка очереди удаления при недоступном хранилище снимков. */
import { beforeEach, expect, it, vi } from 'vitest';

/** Изолируем внешние подключения к БД и реестру. */
const mocks = vi.hoisted(() => ({ query: vi.fn(), delete: vi.fn(), listWritable: vi.fn(), resolveBackend: vi.fn() }));
vi.mock('./db', () => ({ db: {}, pool: { query: mocks.query } }));
vi.mock('../storage/storage-registry', () => ({ ensureStorageRegistryLoaded: async () => mocks }));
import { processVersionObjectDeletions } from './version-object-store';

beforeEach(() => { vi.resetAllMocks(); });

it('выбирает доступные S3 до ограничения партии и удаляет подтверждённые задания', async () => {
  mocks.listWritable.mockReturnValue([
    { backend: 's3', configId: 'local-s3' }, { backend: 'local', configId: 'disk' },
  ]);
  mocks.query.mockResolvedValueOnce({ rows: [{ id: '2', storage_id: 'local-s3', object_key: 'snapshot' }] })
    .mockResolvedValue({ rows: [] });
  mocks.resolveBackend.mockReturnValue({ backend: 's3', delete: mocks.delete });
  expect(await processVersionObjectDeletions(20, 1000)).toBe(1);
  expect(mocks.query.mock.calls[0][0]).toContain('storage_id = ANY($3::text[])');
  expect(mocks.query.mock.calls[0][1]).toEqual([20, 1000, ['local-s3']]);
  expect(mocks.delete).toHaveBeenCalledWith('snapshot');
  expect(mocks.query).toHaveBeenLastCalledWith('DELETE FROM project_version_object_deletions WHERE id = $1', ['2']);
});

it('сохраняет очередь без доступных S3', async () => {
  mocks.listWritable.mockReturnValue([]);
  expect(await processVersionObjectDeletions()).toBe(0);
  expect(mocks.query).not.toHaveBeenCalled();
});

it('сохраняет задание при ошибке удаления объекта', async () => {
  mocks.listWritable.mockReturnValue([{ backend: 's3', configId: 'local-s3' }]);
  mocks.query.mockResolvedValue({ rows: [{ id: '2', storage_id: 'local-s3', object_key: 'snapshot' }] });
  mocks.resolveBackend.mockReturnValue({ backend: 's3', delete: mocks.delete });
  mocks.delete.mockRejectedValue(new Error('Сбой S3'));
  await expect(processVersionObjectDeletions()).rejects.toThrow('Сбой S3');
  expect(mocks.query).toHaveBeenCalledTimes(1);
});
