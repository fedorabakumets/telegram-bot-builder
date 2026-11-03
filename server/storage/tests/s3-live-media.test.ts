/** @fileoverview Проверка чтения оригинала из работающего S3-совместимого сервиса. */
import { describe, expect, it, vi } from 'vitest';
import { CreateBucketCommand, DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

vi.mock('../../database/db', () => ({ db: {} }));
import { S3Backend } from '../s3-backend';
import { openRuntimeMedia, resolveRuntimeMedia } from '../resolve-runtime-media';

describe.skipIf(!process.env.MEDIA_TEST_S3_ENDPOINT)('Настоящее S3-совместимое хранилище', () => {
  it('читает S3-only оригинал из хранилища записи после переключения активного', async () => {
    const endpoint = process.env.MEDIA_TEST_S3_ENDPOINT!;
    const credentials = { accessKeyId: 'media-test-access', secretAccessKey: 'media-test-secret-key' };
    const client = new S3Client({ endpoint, region: 'us-east-1', forcePathStyle: true, credentials });
    const bucket = `media-test-${randomUUID()}`;
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    const makeBackend = (configId: string) => new S3Backend({ configId, name: configId, readOnly: false, s3: { endpointUrl: endpoint, region: 'us-east-1', bucket, forcePathStyle: true }, credentials });
    const previous = makeBackend('previous'), active = makeBackend('active');
    const key = '12/2026-01-01/test.jpg', url = `/uploads/${key}`;
    const media = { projectId: 12, url, filePath: key, storageConfigId: 'previous', storageBackend: 's3', mimeType: 'image/jpeg' };
    try {
      await previous.put(key, Buffer.from('S3-only-original'), 'image/jpeg');
      const deps = { storage: { getMediaFilesByUrls: async () => [media] }, ensureStorageRegistryLoaded: async () => ({ list: () => [active, previous] }), isRegisteredMediaUrl: async () => false };
      const resolved = await resolveRuntimeMedia(12, url, deps as never);
      expect(resolved.backend.configId).toBe('previous');
      const original = await openRuntimeMedia(resolved);
      const chunks: Buffer[] = [];
      for await (const chunk of await original.stream()) chunks.push(Buffer.from(chunk));
      expect(Buffer.concat(chunks).toString()).toBe('S3-only-original');
      expect(original.size).toBe(16);
      await expect(resolveRuntimeMedia(13, url, deps as never)).rejects.toMatchObject({ status: 404 });
      await previous.put(key, Buffer.from('changed'), 'image/jpeg');
      await expect(original.stream()).rejects.toThrow();
    } finally {
      await previous.delete(key);
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
      client.destroy();
    }
  }, 30000);
});
