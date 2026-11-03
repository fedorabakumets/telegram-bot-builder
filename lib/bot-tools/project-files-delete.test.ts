/** @fileoverview Проверки частичного физического удаления без ложного подтверждения. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUploadedPhysicalObjects } from '../../server/routes/botIntegration/handlers/botData/delete-physical-objects';
import { deleteProjectFilesHandler } from '../../server/routes/botIntegration/handlers/botData/deleteProjectFilesHandler';
import { projectFilesRequest } from './project-files-db';
const mocks = vi.hoisted(() => ({ remove: vi.fn(), registry: vi.fn(), fetch: vi.fn(), returning: vi.fn() }));
vi.mock('../../server/storage/storage-registry', () => ({ ensureStorageRegistryLoaded: mocks.registry }));
vi.mock('../../server/database/db', () => ({ db: { delete: () => ({ where: () => ({ returning: mocks.returning }) }) } }));
vi.mock('./api-fetch', () => ({ apiFetch: mocks.fetch }));
beforeEach(() => { vi.resetAllMocks(); mocks.registry.mockResolvedValue({ resolveBackend: () => ({ delete: mocks.remove }) }); });
describe('Подтверждение удаления файлов', () => {
  it('реальный handler сообщает partial после DB удаления и ошибки физического объекта', async () => {
    mocks.returning.mockResolvedValue([{ id: 1, filePath: '12/a', storageConfigId: null }]);
    mocks.remove.mockRejectedValue(new Error('secret storage failure'));
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await deleteProjectFilesHandler({ params: { projectId: '12' }, body: { items: [{ id: 1, source: 'uploaded' }] } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'partial', deleted: 1, missing: 0, physical: expect.objectContaining({ failed: 1 }), persistence: expect.objectContaining({ confirmed: false, databaseConfirmed: true }) }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('secret');
  });
  it.each([{ rows: [] }, { rows: [{ id: 1, filePath: '12/a', storageConfigId: null }] }])('не объявляет полный успех при отсутствующих requested IDs %j', async ({ rows }) => {
    mocks.returning.mockResolvedValue(rows);
    mocks.remove.mockResolvedValue(undefined);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await deleteProjectFilesHandler({ params: { projectId: '12' }, body: { items: [{ id: 1, source: 'uploaded' }, { id: 2, source: 'uploaded' }] } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'partial', deleted: rows.length, requested: 2, missing: 2 - rows.length, persistence: expect.objectContaining({ confirmed: false }) }));
  });
  it('различает удалённый, отсутствующий и ошибочный физические объекты', async () => {
    mocks.remove.mockResolvedValueOnce(undefined).mockRejectedValueOnce(Object.assign(new Error('нет'), { code: 'ENOENT' })).mockRejectedValueOnce(new Error('secret credentials'));
    const value = await deleteUploadedPhysicalObjects([{ filePath: '12/a', storageConfigId: null }, { filePath: '12/b', storageConfigId: null }, { filePath: '12/c', storageConfigId: null }]);
    expect(value).toEqual({ deleted: 1, missing: 1, failed: 1, untracked: 0 });
    expect(JSON.stringify(value)).not.toContain('secret');
  });
  it('отражает недоступный registry как неуспешное физическое удаление', async () => {
    mocks.registry.mockRejectedValue(new Error('secret'));
    expect(await deleteUploadedPhysicalObjects([{ filePath: '12/a', storageConfigId: null }])).toMatchObject({ failed: 1, deleted: 0 });
  });
  it('сохраняет машинное состояние partial и не подтверждает полное сохранение', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ success: false, status: 'partial', deleted: 2, physical: { failed: 1 }, persistence: { confirmed: false, databaseConfirmed: true } }), { status: 207 }));
    const value = await projectFilesRequest(12, 'DELETE', {}, { items: [{ id: 1, source: 'uploaded' }] });
    expect(value).toMatchObject({ error: expect.any(String), status: 'partial', deleted: 2, persistence: { confirmed: false, databaseConfirmed: true } });
  });
});
