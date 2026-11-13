/** @fileoverview Запрет фонового восстановления замороженных ботов и остановленного намерения. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: vi.fn(), instance: vi.fn(), frozen: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: {
  getBotToken: mocks.token, getBotInstanceByToken: mocks.instance,
} }));
vi.mock('./frozenBotStatus', () => ({ isBotFrozen: mocks.frozen }));
import { automaticBotStartAllowed } from './automaticBotStartAllowed';

beforeEach(() => {
  mocks.token.mockReset().mockResolvedValue({ token: '123:new-secret' });
  mocks.instance.mockReset().mockResolvedValue({ desiredStatus: 'running' });
  mocks.frozen.mockReset().mockReturnValue(false);
});

it('проверяет заморозку по актуальной личности, не по старому токену запуска', async () => {
  expect(await automaticBotStartAllowed(3, 4)).toBe(true);
  expect(mocks.frozen).toHaveBeenCalledWith(3, 4, '123:new-secret');
});
it('не снимает заморозку и запрещает автоматический запуск', async () => {
  mocks.frozen.mockReturnValue(true);
  expect(await automaticBotStartAllowed(3, 4)).toBe(false);
});
it('сохранённое stopped важнее исторического running после перезапуска API', async () => {
  mocks.instance.mockResolvedValue({ desiredStatus: 'stopped', status: 'running' });
  expect(await automaticBotStartAllowed(3, 4)).toBe(false);
});
it('учитывает заморозку, появившуюся во время чтения намерения из БД', async () => {
  mocks.instance.mockImplementation(async () => {
    mocks.frozen.mockReturnValue(true);
    return { desiredStatus: 'running' };
  });
  expect(await automaticBotStartAllowed(3, 4)).toBe(false);
});
