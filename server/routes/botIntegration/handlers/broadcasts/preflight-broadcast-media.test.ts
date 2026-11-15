/** @fileoverview Проверки предварительной проверки уникальных вложений без отправки сообщений. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ owned: vi.fn(), remote: vi.fn() }));
vi.mock('../messages/owned-media-content', () => ({ assertOwnedMediaAvailable: mocks.owned }));
vi.mock('../messages/media-reference-security', () => ({ assertRemoteMediaReference: mocks.remote }));
import { preflightBroadcastMedia } from './preflight-broadcast-media';
beforeEach(() => { vi.clearAllMocks(); });
it('проверяет уникальный локальный или S3 адрес только один раз', async () => {
  const file = { id: 0, url: '/uploads/4/photo.jpg', type: 'photo' };
  await preflightBroadcastMedia([file, file], 4);
  expect(mocks.owned).toHaveBeenCalledExactlyOnceWith(file.url, 4);
  expect(mocks.remote).not.toHaveBeenCalled();
});
it('сохраняет проверку внешних ссылок и file_id', async () => {
  await preflightBroadcastMedia([{ id: 0, url: 'https://example.com/photo.jpg', type: 'photo' }], 4);
  expect(mocks.remote).toHaveBeenCalledExactlyOnceWith('https://example.com/photo.jpg');
});
it('прерывается при недоступном вложении до проверки следующих файлов', async () => {
  mocks.owned.mockRejectedValueOnce(new Error('Хранилище недоступно'));
  await expect(preflightBroadcastMedia([{ id: 0, url: '/uploads/4/a.jpg', type: 'photo' },
    { id: 1, url: '/uploads/4/b.jpg', type: 'photo' }], 4)).rejects.toThrow('Хранилище недоступно');
  expect(mocks.owned).toHaveBeenCalledTimes(1);
});
