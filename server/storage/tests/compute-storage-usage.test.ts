/** @fileoverview Проверка общего объёма S3 и сохранения независимой локальной квоты. */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../routes/media/upload-storage-helper', () => ({ computeLocalUsedBytes: vi.fn() }));
vi.mock('../compute-s3-used-bytes', () => ({ computeS3UsedBytes: vi.fn() }));
vi.mock('../storage-config', () => ({ readStorageLimitBytes: vi.fn() }));

import { computeLocalUsedBytes } from '../../routes/media/upload-storage-helper';
import { computeS3UsedBytes } from '../compute-s3-used-bytes';
import { readStorageLimitBytes } from '../storage-config';
import { computeStorageQuota } from '../compute-quota';

afterEach(() => vi.resetAllMocks());

describe('Объём файлов проекта', () => {
  it('учитывает S3 в общем объёме без превышения локальной квоты', async () => {
    vi.mocked(computeLocalUsedBytes).mockResolvedValue(10);
    vi.mocked(computeS3UsedBytes).mockResolvedValue(1000);
    vi.mocked(readStorageLimitBytes).mockReturnValue(100);
    expect(await computeStorageQuota(9)).toEqual({
      usedBytes: 10, s3UsedBytes: 1000, totalUsedBytes: 1010,
      limitBytes: 100, quotaExceeded: false,
    });
    expect(computeS3UsedBytes).toHaveBeenCalledWith(9);
    expect(computeLocalUsedBytes).toHaveBeenCalledWith(9);
  });

  it('сохраняет превышение локальной квоты и безлимитный режим', async () => {
    vi.mocked(computeLocalUsedBytes).mockResolvedValue(101);
    vi.mocked(computeS3UsedBytes).mockResolvedValue(200);
    vi.mocked(readStorageLimitBytes).mockReturnValue(100);
    expect((await computeStorageQuota(9)).quotaExceeded).toBe(true);
    vi.mocked(readStorageLimitBytes).mockReturnValue(null);
    expect(await computeStorageQuota(9)).toMatchObject({ totalUsedBytes: 301, quotaExceeded: false });
  });
});
