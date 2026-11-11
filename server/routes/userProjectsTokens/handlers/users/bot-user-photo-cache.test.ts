/** @fileoverview Проверки сроков кэша, изоляции секретов и ограничений загрузки аватаров. */
import { describe, expect, it, vi } from 'vitest';
import { createBotUserPhotoCache, type BotUserPhotoInput } from './bot-user-photo-cache-engine';

/** Базовые параметры, не содержащие действующих секретов. */
const input: BotUserPhotoInput = { projectId: 1, tokenId: 2, token: 'test-token', userId: '3' };

describe('кэш аватаров', () => {
  it('объединяет параллельные запросы одного ключа', async () => {
    let finish!: (url: string) => void;
    const load = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const get = createBotUserPhotoCache({ load, exists: async () => true });
    const first = get(input);
    const second = get(input);
    await Promise.resolve();
    finish('/photo.jpg');
    expect(await Promise.all([first, second])).toEqual(['/photo.jpg', '/photo.jpg']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('обновляет успешный результат после часа и при удалении файла', async () => {
    let time = 0;
    const load = vi.fn(async () => '/photo.jpg');
    const exists = vi.fn(async () => true);
    const get = createBotUserPhotoCache({ load, exists, now: () => time });
    await get(input);
    time = 3_599_999;
    await get(input);
    expect(load).toHaveBeenCalledTimes(1);
    time = 3_600_000;
    await get(input);
    expect(load).toHaveBeenCalledTimes(2);
    exists.mockResolvedValue(false);
    await get(input);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('различает отсутствие аватара и кратковременную ошибку', async () => {
    let time = 0;
    const load = vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
    const get = createBotUserPhotoCache({ load, exists: async () => true, now: () => time });
    await get(input);
    time = 299_999;
    await get(input);
    expect(load).toHaveBeenCalledTimes(1);
    time = 300_000;
    load.mockRejectedValueOnce(new Error('сбой'));
    expect(await get(input)).toBeNull();
    time = 329_999;
    await get(input);
    expect(load).toHaveBeenCalledTimes(2);
    time = 330_000;
    await get(input);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('изолирует проекты, записи токена, пользователей и смену секрета', async () => {
    const load = vi.fn(async () => '/photo.jpg');
    const get = createBotUserPhotoCache({ load, exists: async () => true });
    for (const patch of [{}, { projectId: 2 }, { tokenId: 3 }, { userId: '4' }, { token: 'rotated' }]) {
      await get({ ...input, ...patch });
    }
    expect(load).toHaveBeenCalledTimes(5);
  });

  it('ограничивает активные операции и освобождает слот после завершения', async () => {
    const releases: Array<(url: null) => void> = [];
    const load = vi.fn(() => new Promise<null>((resolve) => { releases.push(resolve); }));
    const get = createBotUserPhotoCache({ load, exists: async () => true });
    const active = [1, 2, 3, 4].map((tokenId) => get({ ...input, tokenId }));
    await Promise.resolve();
    expect(await get({ ...input, tokenId: 5 })).toBeNull();
    expect(load).toHaveBeenCalledTimes(4);
    releases.forEach((release) => release(null));
    await Promise.all(active);
    load.mockResolvedValue(null);
    await get({ ...input, tokenId: 5 });
    expect(load).toHaveBeenCalledTimes(5);
  });

  it('сохраняет доступ к готовому аватару при четырёх активных скачиваниях', async () => {
    const releases: Array<(url: null) => void> = [];
    const load = vi.fn<() => Promise<string | null>>().mockResolvedValue('/ready.jpg');
    const get = createBotUserPhotoCache({ load, exists: async () => true });
    await get({ ...input, tokenId: 100 });
    load.mockImplementation(() => new Promise<null>((resolve) => { releases.push(resolve); }));
    const active = [1, 2, 3, 4].map((tokenId) => get({ ...input, tokenId }));
    expect(await get({ ...input, tokenId: 100 })).toBe('/ready.jpg');
    releases.forEach((release) => release(null));
    await Promise.all(active);
  });

  it('вытесняет старые записи при превышении 1000 ключей', async () => {
    const load = vi.fn(async () => '/photo.jpg');
    const get = createBotUserPhotoCache({ load, exists: async () => true });
    for (let tokenId = 0; tokenId <= 1000; tokenId++) await get({ ...input, tokenId });
    await get({ ...input, tokenId: 0 });
    expect(load).toHaveBeenCalledTimes(1002);
  });
});
