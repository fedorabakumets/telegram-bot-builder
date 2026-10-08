/**
 * @fileoverview Проверки сохранения авторизации и уведомления вкладок юзербота.
 * @module lib/bot-tools/userbot-auth-sync.test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Подмены записи в БД и безопасного уведомления */
const mocks = vi.hoisted(() => ({ update: vi.fn(), emit: vi.fn(), progress: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: { updateBotToken: mocks.update } }));
vi.mock('../../server/terminal/emitTokenUpdated', () => ({ emitTokenUpdated: mocks.emit }));
vi.mock('../../server/routes/botTokens/emit-userbot-auth-progress', () => ({ emitUserbotAuthProgress: mocks.progress }));
import { saveUserbotAuthResult } from '../../server/routes/botTokens/save-userbot-auth-result';

beforeEach(() => {
  mocks.update.mockReset().mockResolvedValue({ id: 2 });
  mocks.emit.mockReset().mockResolvedValue(undefined);
  mocks.progress.mockReset().mockResolvedValue(undefined);
});

describe('уведомление об авторизации юзербота', () => {
  it('сначала сохраняет сессию, затем сообщает об изменении без передачи секрета', async () => {
    await saveUserbotAuthResult(1, 2, { ok: true, session_string: 'secret-session' });
    expect(mocks.update).toHaveBeenCalledWith(2, { userbotSessionString: 'secret-session', userbotEnabled: 1 });
    expect(mocks.emit).toHaveBeenCalledWith({ projectId: 1, tokenId: 2, changedFields: ['userbotEnabled', 'userbotSessionString'], source: 'api' });
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.emit.mock.invocationCallOrder[0]);
    expect(JSON.stringify(mocks.emit.mock.calls)).not.toContain('secret-session');
    expect(mocks.progress).toHaveBeenCalledWith(1, 2, { step: 'done' });
  });
  it.each([{ ok: false }, { ok: true }, { ok: true, session_string: '' }])('не уведомляет при ошибке или промежуточном шаге %j', async (result) => {
    await saveUserbotAuthResult(1, 2, result);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
    expect(mocks.progress).not.toHaveBeenCalled();
  });
  it('не уведомляет при сбое сохранения', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Ошибка БД'));
    await expect(saveUserbotAuthResult(1, 2, { ok: true, session_string: 'secret' })).rejects.toThrow('Ошибка БД');
    expect(mocks.emit).not.toHaveBeenCalled();
  });
});
