/** @fileoverview Проверка доступа и ограничений приёма входящего фото. */
import express from 'express';
import { describe, it, expect, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), registry: vi.fn(), rate: vi.fn().mockResolvedValue(0) }));
vi.mock('../../storage/media-runtime-token', () => ({ verifyMediaRuntimeWriteToken: mocks.verify }));
vi.mock('../../storage/storage-registry', () => ({ ensureStorageRegistryLoaded: mocks.registry }));
vi.mock('./upload-storage-helper', () => ({ resolveUploadBackend: vi.fn(), persistUploadToBackend: vi.fn() }));
vi.mock('../../storage/compute-quota', () => ({ computeStorageQuota: vi.fn() }));
vi.mock('./incoming-photo-limit', () => ({ incomingPhotoRetryAfter: mocks.rate }));
vi.mock('./create-registered-upload', () => ({ createRegisteredUpload: vi.fn() }));
import { setupRuntimeMediaUploadRoute } from './runtime-media-upload-route';

/** Отправляет тестовый запрос в локальное приложение.
 * @param allowed - Результат проверки токена
 * @param body - Тело запроса
 * @returns Код ответа
 */
async function send(allowed: boolean, body: Uint8Array): Promise<number> {
  const app = express(); setupRuntimeMediaUploadRoute(app); mocks.verify.mockReturnValue(allowed);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const port = (server.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/runtime/media/incoming-photo?projectId=17`, {
      method: 'POST', headers: { Authorization: `Bearer ${'a'.repeat(64)}`, 'Content-Type': 'image/jpeg' }, body: new Uint8Array(body).buffer,
    });
    return res.status;
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}

describe('приём входящего фото', () => {
  it('отклоняет чужой токен до записи и чтения хранилища', async () => {
    expect(await send(false, new Uint8Array([255, 216]))).toBe(401);
    expect(mocks.registry).not.toHaveBeenCalled();
  });
  it('возвращает 429 и время повтора до записи', async () => {
    mocks.rate.mockResolvedValueOnce(17);
    expect(await send(true, new Uint8Array([255, 216]))).toBe(429);
    expect(mocks.registry).not.toHaveBeenCalled();
  });
  it('отклоняет данные без сигнатуры JPEG', async () => {
    expect(await send(true, new TextEncoder().encode('bad'))).toBe(400);
    expect(mocks.registry).not.toHaveBeenCalled();
  });
});
