/** @fileoverview Проверка различения блокировки пользователем и недоступности самого бота. */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../storages/storage', () => ({ storage: {} }));
import { resolveBroadcastErrorStatus } from '../botIntegration/handlers/broadcasts/mark-user-delivery-status';
import { botAvailabilityLabel } from '../../../shared/bot-availability-label';
import { classifyChatAction } from '../dialogs/check-chat-access-classify';
describe('Различение состояний бота и пользователя', () => {
  it('не считает ошибку самого бота блокировкой или удалением пользователя', () => {
    expect(resolveBroadcastErrorStatus(403, 'Forbidden: bot was blocked by the user')).toBe('blocked');
    expect(resolveBroadcastErrorStatus(403, 'Bot disabled')).toBe('failed');
    expect(resolveBroadcastErrorStatus(401, 'Unauthorized')).toBe('failed');
    expect(resolveBroadcastErrorStatus(403, 'Forbidden: bot is deactivated')).toBe('failed');
    expect(resolveBroadcastErrorStatus(400, 'Bad Request: chat not found')).toBe('failed');
    expect(resolveBroadcastErrorStatus(403, 'Forbidden: user is deactivated')).toBe('not_found');
  });
  it('не выдаёт недействительный токен или локальное отключение за блокировку Telegram', () => {
    expect(botAvailabilityLabel('unauthorized', 0)).toBe('Telegram отклонил токен');
    expect(botAvailabilityLabel(null, 0)).toBe('Бот отключён');
    expect(botAvailabilityLabel('bot_blocked', 0)).toBe('Бот заблокирован Telegram');
    expect(botAvailabilityLabel(null, 1)).toBeNull();
  });
  it('при проверке чата не записывает проблему бота в статус человека', () => {
    const classify = (description: string) => classifyChatAction({ httpOk: false, errorCode: 403, description }).kind;
    expect(classify('Bot disabled')).toBe('error');
    expect(classify('Forbidden: bot is deactivated')).toBe('error');
    expect(classify('Forbidden: bot was blocked by the user')).toBe('kicked');
    expect(classify('Forbidden: user is deactivated')).toBe('deleted');
  });
});
