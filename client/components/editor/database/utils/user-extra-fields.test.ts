/** @fileoverview Проверка извлечения дополнительных полей пользователей из ответов API. */
import { expect, it } from 'vitest';
import { getUserTags, getUserUpdatedAt } from './user-extra-fields';

it('читает строковые теги из пользовательских данных и безопасно обрабатывает другие значения', () => {
  expect(getUserTags({ userData: { tags: ['новый', 4, 'важный'] } })).toEqual(['новый', 'важный']);
  expect(getUserTags({ tags: ['старый'], userData: { tags: ['новый'] } })).toEqual(['старый']);
  expect(getUserTags({ userData: null })).toEqual([]);
});

it('показывает дату обновления только если она действительно есть в ответе', () => {
  expect(getUserUpdatedAt({ lastInteraction: '2026-01-01' })).toBeNull();
  expect(getUserUpdatedAt({ updatedAt: '2026-01-02' })).toBe('2026-01-02');
});
