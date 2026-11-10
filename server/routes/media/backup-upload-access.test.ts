/** @fileoverview Проверка выбора хранилища резервных копий для загрузок. */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../database/db', () => ({ db: {} }));
import { setRuntimeOverlay } from '../../services/runtime-overlay';
import { resolveUploadBackend } from './upload-storage-helper';

describe('загрузка в хранилище бэкапов', () => {
  const backup = { backend: 's3', configId: 'backup', readOnly: false };
  const ordinary = { backend: 's3', configId: 'ordinary', readOnly: false };
  const registry = {
    getActiveBackend: vi.fn(() => ordinary),
    resolveBackend: vi.fn((id: string) => id === 'backup' ? backup : ordinary),
  };
  afterEach(() => { setRuntimeOverlay({}); vi.clearAllMocks(); });

  it('отклоняет выбор выделенного хранилища бэкапов из запроса', () => {
    setRuntimeOverlay({ DB_BACKUPS_STORAGE_ID: 'backup' });
    expect(() => resolveUploadBackend(registry as never, 'backup')).toThrow();
    expect(registry.resolveBackend).not.toHaveBeenCalled();
    expect(resolveUploadBackend(registry as never, 'ordinary')).toBe(ordinary);
  });

  it('сохраняет работу явно настроенного общего хранилища загрузок', () => {
    setRuntimeOverlay({ DB_BACKUPS_STORAGE_ID: 'backup', UPLOADS_STORAGE_ID: 'backup' });
    expect(resolveUploadBackend(registry as never, 'ordinary')).toBe(backup);
  });

  it('сохраняет работу общего активного хранилища', () => {
    setRuntimeOverlay({ DB_BACKUPS_STORAGE_ID: 'backup' });
    registry.getActiveBackend.mockReturnValueOnce(backup);
    expect(resolveUploadBackend(registry as never, 'backup')).toBe(backup);
  });
});
