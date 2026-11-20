/** @fileoverview Защита зафиксированной аудитории от пустого списка, смены бота и расширения. */
import { expect, it } from 'vitest';
import { applyFixedAudience, validateFixedAudience } from './fixed-audience';
import type { NewBroadcastFormData } from '../types';

/** Исходная форма могла содержать общую аудиторию и группы. */
const form: NewBroadcastFormData = { name: '', messageText: 'Тест', mediaUrls: [], tokenIds: [22],
  filters: { audienceType: 'all', groupIds: ['-1001'] }, groupsByTokenId: { 22: ['-1001'] } };
const fixed = { tokenId: 11, userIds: Object.freeze(['123', '456']), label: 'Найденные пользователи' };

it('оставляет только найденных людей и одного исходного бота', () => {
  const result = applyFixedAudience(form, fixed);
  expect(result.tokenIds).toEqual([11]);
  expect(result.filters).toEqual({ audienceType: 'manual', userIds: ['123', '456'] });
  expect(result.groupsByTokenId).toEqual({});
  expect(() => validateFixedAudience(result)).not.toThrow();
  expect(result.filters.userIds).not.toBe(fixed.userIds);
});
it('запрещает пустой список, отправку всем, чужого бота и добавление людей', () => {
  const valid = applyFixedAudience(form, fixed);
  for (const invalid of [
    { ...valid, filters: { audienceType: 'all' as const } },
    { ...valid, tokenIds: [22] },
    { ...valid, filters: { audienceType: 'manual' as const, userIds: ['123', '456', '789'] } },
    applyFixedAudience(form, { ...fixed, userIds: [] }),
  ]) expect(() => validateFixedAudience(invalid)).toThrow('Список получателей');
});
