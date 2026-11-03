/** @fileoverview Проверки точной карточки пользователя и безопасной валидации метаданных/настроек. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBotUserDataHandler } from '../../server/routes/botUsers/handlers/getBotUserDataHandler';
import { updateMediaMetadataSchema } from '../../shared/schema/media-metadata-contracts';
import { requireBotSettingBody } from '../../server/middleware/require-bot-setting-body';
const mocks = vi.hoisted(() => ({ query: vi.fn(), token: vi.fn() }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/routes/utils/resolve-request-token', () => ({ getRequestTokenId: () => 9, resolveEffectiveProjectTokenId: mocks.token }));
beforeEach(() => { vi.resetAllMocks(); mocks.token.mockResolvedValue(9); });
describe('Контракты пользовательских разделов', () => {
  it('читает точного пользователя и ответы только выбранного бота и проекта', async () => {
    mocks.query.mockResolvedValue({ rows: [{ userId: '45', userData: { answer: 'Да' } }] });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getBotUserDataHandler({ params: { projectId: '12', userId: '45' } } as never, res as never);
    expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '45']);
    expect(res.json).toHaveBeenCalledWith({ userId: '45', userData: { answer: 'Да' }, projectId: 12, tokenId: 9 });
  });
  it('возвращает404 для отсутствующей карточки без подстановки другого пользователя', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getBotUserDataHandler({ params: { projectId: '12', userId: '45' } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it.each([{ filePath: '/uploads/../.env' }, { projectId: 13 }, { url: '/uploads/13/a' }])('не позволяет менять путь/владельца медиа %j', body => {
    expect(updateMediaMetadataSchema.safeParse(body).success).toBe(false);
  });
  it('использует общий settings union до write и отвергает посторонние параметры', () => {
    const middleware = requireBotSettingBody('log-level');
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    middleware({ body: { logLevel: 'BAD', token: 'secret' } } as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    const req = { body: { logLevel: 'ERROR', token: 'secret' } };
    middleware(req as never, res as never, next);
    expect(req.body).toEqual({ logLevel: 'ERROR' });
    expect(next).toHaveBeenCalledOnce();
  });
});
