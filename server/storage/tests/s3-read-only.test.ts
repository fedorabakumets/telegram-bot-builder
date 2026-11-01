/** @fileoverview Проверка запрета записи в S3-хранилище предпросмотра до сетевого запроса. */
import { describe, it, expect, vi } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Backend } from '../s3-backend';

describe('S3 только для чтения', () => {
  it('не отправляет запросы записи и удаления', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send');
    const backend = new S3Backend({
      configId: 'preview', name: 'Предпросмотр', readOnly: true,
      s3: { bucket: 'preview', region: 'auto', forcePathStyle: false },
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    });
    try {
      await expect(backend.put('photo.png', Buffer.from('test'), 'image/png')).rejects.toThrow('только для чтения');
      await expect(backend.delete('photo.png')).rejects.toThrow('только для чтения');
      expect(send).not.toHaveBeenCalled();
    } finally { send.mockRestore(); }
  });
});
