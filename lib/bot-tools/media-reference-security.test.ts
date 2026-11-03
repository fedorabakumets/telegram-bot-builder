/** @fileoverview Защита медиа от чтения секретов сервера и подмены проекта ресурса. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractMediaFromNode } from '../../server/routes/botIntegration/handlers/messages/extract-media';
import { remoteMediaReferenceSchema } from '../../shared/schema/media-reference-contracts';
import { buildMediaFiles } from '../../server/routes/botIntegration/handlers/messages/build-media-files';
import { resolveOwnedMediaPath } from '../../server/routes/botIntegration/handlers/messages/media-reference-security';
import { sendTelegramMessage } from '../../server/routes/botIntegration/handlers/messages/send-telegram-message';
import { requireResourceOwnership } from '../../server/middleware/requireResourceOwnership';
const mocks = vi.hoisted(() => ({ media: vi.fn(), read: vi.fn(), fetch: vi.fn(), access: vi.fn(), owner: vi.fn(), real: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: { getMediaFilesByUrls: mocks.media, hasProjectAccess: mocks.access } }));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: mocks.owner }));
vi.mock('../../server/middleware/bot-api-actor', () => ({ getBotActorId: mocks.owner }));
vi.mock('node:fs', () => ({ realpathSync: mocks.real }));
vi.mock('fs', () => ({ existsSync: vi.fn(() => true), readFileSync: mocks.read }));
vi.mock('node:dns/promises', () => ({ lookup: vi.fn(async () => [{ address: '93.184.216.34' }]) }));
vi.mock('../../server/utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
beforeEach(() => { vi.resetAllMocks(); mocks.owner.mockReturnValue(1); mocks.access.mockResolvedValue(true); });
describe('Изоляция медиа', () => {
  it('проверяет владение mediaId даже когда URL файла публичный', async () => {
    const storage = { getMediaFile: vi.fn(async () => ({ id: 3, projectId: 13, url: 'https://example.com/private.jpg' })) };
    await expect(extractMediaFromNode({ attachedMedia: [{ mediaId: 3, mediaType: 'photo' }] }, storage as never, 12)).rejects.toThrow();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('декодирует строгий file_id независимо от пробелов и порядка ключей', () => {
    const value = ' { "fileIdsByToken": {"9": "AgACabcdefghijk"}, "__type": "file_id" }';
    expect(remoteMediaReferenceSchema.safeParse(value).success).toBe(true);
    expect(buildMediaFiles([value], 9)).toEqual([{ id: 0, url: 'AgACabcdefghijk', type: 'photo' }]);
  });
  it.each(['/uploads/../.env', '/uploads/12/../../.env', 'file:///etc/passwd', 'https://127.0.0.1/x', 'http://localhost/x', '{"__type":"file_id","fileIdsByToken":{"9":"/uploads/../.env"}}'])('удалённый контракт запрещает %s', value => {
    expect(remoteMediaReferenceSchema.safeParse(value).success).toBe(false);
  });
  it('строгий file_id запрещает локальный путь и fallback чужого токена', () => {
    expect(() => buildMediaFiles(['{"__type":"file_id","fileIdsByToken":{"9":"/uploads/../.env"}}'], 9)).toThrow();
    expect(() => buildMediaFiles(['{"__type":"file_id","fileIdsByToken":{"10":"AgACabcdefghijk"}}'], 9)).toThrow();
  });
  it.each(['/uploads/../.env', '/uploads/13/a.txt', '/uploads/12/%2e%2e/.env'])('не читает и не отправляет секреты через %s', async url => {
    await expect(sendTelegramMessage('token', '45', '', [{ id: 1, type: 'document', url }], [], true, undefined, 12)).rejects.toThrow();
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('проверяет реальную принадлежность загруженного файла проекту до чтения', async () => {
    mocks.media.mockResolvedValue([{ projectId: 13, url: '/uploads/12/a.txt' }]);
    await expect(resolveOwnedMediaPath('/uploads/12/a.txt', 12)).rejects.toThrow();
    expect(mocks.real).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('не допускает symlink за пределы каталога проекта', async () => {
    mocks.media.mockResolvedValue([{ projectId: 12, url: '/uploads/12/a.txt' }]);
    mocks.real.mockReturnValueOnce('C:/app/uploads').mockReturnValueOnce('C:/app/.env');
    await expect(resolveOwnedMediaPath('/uploads/12/a.txt', 12)).rejects.toThrow();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('отказывает до write при URL mismatch даже если оба проекта доступны', async () => {
    const guard = requireResourceOwnership(async () => 13);
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await guard({ params: { projectId: '12', tokenId: '9' } } as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(mocks.access).not.toHaveBeenCalled();
  });
});
