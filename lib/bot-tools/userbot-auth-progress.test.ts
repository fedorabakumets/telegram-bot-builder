/**
 * @fileoverview Проверки контракта и рассылки шагов авторизации юзербота.
 * @module lib/bot-tools/userbot-auth-progress.test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseUserbotAuthProgress } from '../../shared/project-sync/userbot-auth-progress';

/** Подмена рассылки события проекта */
const mocks = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../server/terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
import { emitUserbotAuthProgress } from '../../server/routes/botTokens/emit-userbot-auth-progress';

beforeEach(() => mocks.broadcast.mockReset().mockResolvedValue(undefined));

describe('шаги авторизации юзербота', () => {
  it.each(['code', '2fa'] as const)('передаёт шаг %s и телефон без секретных полей', async (step) => {
    const data = { step, phone: '+7900', code: 'secret', password: 'secret', session_string: 'secret', apiHash: 'secret' };
    await emitUserbotAuthProgress(1, 2, data);
    expect(mocks.broadcast).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'userbot-auth-progress', projectId: 1, tokenId: 2, data: { step, phone: '+7900' },
    }));
    expect(JSON.stringify(mocks.broadcast.mock.calls)).not.toContain('secret');
  });
  it('не передаёт телефон после завершения и отклоняет неверный шаг', () => {
    expect(parseUserbotAuthProgress({ step: 'done', phone: '+7900' })).toEqual({ step: 'done' });
    expect(parseUserbotAuthProgress({ step: 'code' })).toBeNull();
    expect(parseUserbotAuthProgress({ step: 'other', phone: '+7900' })).toBeNull();
  });
});
