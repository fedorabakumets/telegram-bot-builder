/** @fileoverview Проверка этапов телефонного входа без подключения к Telegram. */
import { expect, it, vi } from 'vitest';
import {
  continueProjectTelegramPhoneAuth, startProjectTelegramPhoneAuth,
} from '../../server/bots/project-telegram-accounts/phone-auth';
import { encodeTelegramSession } from '../../server/bots/project-telegram-accounts/session-format';

const { close, request } = vi.hoisted(() => ({ close: vi.fn(), request: vi.fn() }));
vi.mock('../../server/bots/project-telegram-accounts/phone-worker', () => ({
  createProjectPhoneWorker: () => ({ close, request }),
}));

it('изолирует владельца, обрабатывает повтор кода и завершает соединение до передачи сессии', async () => {
  const session = encodeTelegramSession(2, '149.154.167.51', 443, Buffer.alloc(256, 11));
  request.mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({ ok: false, error: 'invalid_code', message: 'Скрытая подробность' })
    .mockResolvedValueOnce({ ok: true, needs_2fa: true })
    .mockResolvedValueOnce({ ok: true, session_string: session, telegram_user_id: '12345' })
    .mockResolvedValueOnce({ ok: true });

  await expect(startProjectTelegramPhoneAuth('owner:project:account', {
    apiId: '12345', apiHash: 'a'.repeat(32), phone: '+15550123123',
  })).resolves.toEqual({ stage: 'code' });
  await expect(continueProjectTelegramPhoneAuth('other:project:account', 'code', { code: '12345' })).rejects.toThrow('Шаг недоступен');
  await expect(continueProjectTelegramPhoneAuth('owner:project:account', 'code', { code: '11111' })).rejects.toThrow('Неверный код');
  await expect(continueProjectTelegramPhoneAuth('owner:project:account', 'code', { code: '12345' })).resolves.toEqual({ stage: 'password' });
  await expect(continueProjectTelegramPhoneAuth('owner:project:account', 'password', { password: 'test-only' }))
    .resolves.toMatchObject({ stage: 'done', session: { sessionKind: 'phone', telegramUserId: '12345', sessionString: session } });
  expect(request).toHaveBeenLastCalledWith('disconnect', {});
  expect(close).toHaveBeenCalledTimes(1);
});
