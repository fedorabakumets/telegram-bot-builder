/** @fileoverview Проверка выбора групп с ошибками и защиты повторной отправки. */
import { describe, expect, it } from 'vitest';
import { resolveRetryAudience } from './resolve-retry-audience';
import { validateRetryAudience } from './validate-retry-audience';
import { canNavigateBroadcastStep } from '../wizard/can-navigate-broadcast-step';
import type { NewBroadcastFormData } from '../types';

/**
 * Создаёт форму с проверенными получателями исходной рассылки.
 * @param userIds - Пользователи с ошибками
 * @param groupIds - Группы с ошибками
 * @returns Форма для проверки отправки
 */
function form(userIds: string[], groupIds: string[]): NewBroadcastFormData {
  return { name: '', messageText: 'Повтор', mediaUrls: [], tokenIds: [11],
    filters: { audienceType: 'retry', retryBroadcastId: 7, userIds },
    groupsByTokenId: { 11: groupIds }, retryAudience: { tokenId: 11, broadcastId: 7, userIds, groupIds } };
}

describe('Повтор ошибок доставки группам', () => {
  it('выбирает пользователей и только принадлежащие боту группы с failed', () => {
    expect(resolveRetryAudience([
      { userId: '123', status: 'failed' }, { userId: '-1001', status: 'failed' },
      { userId: '-1001', status: 'failed' }, { userId: '-1002', status: 'failed' },
      { userId: '-1003', status: 'sent' }, { userId: '124', status: 'blocked' },
      { userId: '-1004', status: 'not_found' }, { userId: '0', status: 'failed' },
    ], ['-1001', '-1003', '-1004'])).toEqual({ userIds: ['123'], groupIds: ['-1001'] });
  });
  it('не повторяет успешную или ограниченную доставку даже при дублирующей failed записи', () => {
    expect(resolveRetryAudience([{ userId: '-1', status: 'failed' }, { userId: '-1', status: 'sent' }], ['-1']).groupIds).toEqual([]);
  });
  it.each([[['123'], ['-1001']], [[], ['-1001']]])('разрешает смешанную и только групповую аудиторию', (users, groups) => {
    const data = form(users, groups);
    expect(() => validateRetryAudience(data)).not.toThrow();
    expect(canNavigateBroadcastStep(2, 1, data)).toBe(true);
    expect(canNavigateBroadcastStep(3, 1, data)).toBe(true);
    expect(data.filters.userIds).toEqual(users);
  });
  it('отклоняет пустой результат, чужого бота, смену источника и произвольные группы', () => {
    const empty = form([], []);
    const bot = form([], ['-1']); bot.tokenIds = [12];
    const source = form([], ['-1']); source.filters.retryBroadcastId = 8;
    const extra = form([], ['-1']); extra.groupsByTokenId = { 11: ['-1', '-2'] };
    const foreign = form([], ['-1']); foreign.groupsByTokenId = { 11: ['-1'], 12: ['-2'] };
    for (const data of [empty, bot, source, extra, foreign]) {
      expect(() => validateRetryAudience(data)).toThrow();
      expect(canNavigateBroadcastStep(2, 1, data)).toBe(false);
    }
  });
});
