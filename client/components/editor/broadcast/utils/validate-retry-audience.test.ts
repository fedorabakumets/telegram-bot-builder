/** @fileoverview Защита повторной рассылки от пустой или чужой аудитории. */
import { describe, expect, it } from 'vitest';
import { validateRetryAudience } from './validate-retry-audience';
import type { NewBroadcastFormData } from '../types';

/**
 * Создаёт минимальные данные повторной рассылки.
 * @returns Форма для проверки ограничений отправки
 */
function form(): NewBroadcastFormData {
  return { name: '', messageText: 'Повтор', mediaUrls: [], retryAudience: { tokenId: 11, broadcastId: 7, userIds: ['123'], groupIds: [] }, tokenIds: [11], filters: { audienceType: 'retry', retryBroadcastId: 7, userIds: ['123'] } };
}

describe('Повторная аудитория', () => {
  it('разрешает явно выбранных пользователей одного бота', () => {
    expect(() => validateRetryAudience(form())).not.toThrow();
  });
  it('не разрешает пустую аудиторию и нескольких ботов', () => {
    const empty = form(); empty.filters.userIds = [];
    const multiple = form(); multiple.tokenIds = [11, 12];
    expect(() => validateRetryAudience(empty)).toThrow();
    expect(() => validateRetryAudience(multiple)).toThrow();
  });
  it('отклоняет группы, отсутствующую рассылку и превышение лимита', () => {
    const group = form(); group.filters.userIds = ['-100123'];
    const missing = form(); missing.filters.retryBroadcastId = undefined;
    const large = form(); large.filters.userIds = Array.from({ length: 10001 }, (_, i) => String(i));
    for (const item of [group, missing, large]) expect(() => validateRetryAudience(item)).toThrow();
  });
  it('не меняет правила обычной рассылки', () => {
    const normal = form(); normal.filters = { audienceType: 'all' };
    expect(() => validateRetryAudience(normal)).not.toThrow();
  });
});
