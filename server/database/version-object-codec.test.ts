/**
 * @fileoverview Проверки сжатия и целостности снимков версий.
 */
import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { decodeSnapshot, encodeSnapshot } from './version-object-codec';
import type { ProjectVersion } from '@shared/schema';

/**
 * Создаёт метаданные снимка для проверки декодирования.
 * @param bytes - Ожидаемый размер JSON
 * @param sha256 - Ожидаемая контрольная сумма
 * @returns Метаданные тестовой версии
 */
function version(bytes: number, sha256: string): ProjectVersion {
  return { id: 1, projectId: 1, snapshot: null, snapshotBytes: bytes, snapshotSha256: sha256,
    snapshotStorageId: 'test', snapshotKey: 'test.json.gz', snapshotState: 'ready', label: null,
    authorId: null, authorKind: null, kind: 'auto', createdAt: new Date(),
    snapshotRetryAt: null, snapshotAttempts: 0 };
}

describe('снимки версий в S3', () => {
  it('восстанавливает JSON и проверяет SHA-256', async () => {
    const original = { sheets: [{ id: 'first', nodes: [{ id: 'a' }] }] };
    const encoded = encodeSnapshot(original);
    const restored = await decodeSnapshot(Readable.from([encoded.body]), version(encoded.bytes, encoded.sha256));
    expect(restored).toEqual(original);
  });

  it('отвергает объект с неправильной контрольной суммой', async () => {
    const encoded = encodeSnapshot({ nodes: [] });
    await expect(decodeSnapshot(Readable.from([encoded.body]), version(encoded.bytes, '0'.repeat(64))))
      .rejects.toThrow('Контрольная сумма');
  });
});
