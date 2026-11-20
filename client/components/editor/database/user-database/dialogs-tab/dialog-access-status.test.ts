/** @fileoverview Проверки меток доступа без предварительного открытия переписки. */
import { describe, expect, it } from 'vitest';
import { dialogAccessStatus } from './dialog-access-status';

describe('метка доступа диалога', () => {
  it('показывает сохранённую блокировку без клиентского кэша', () => {
    expect(dialogAccessStatus({ isBlocked: true })).toBe('kicked');
    expect(dialogAccessStatus({ isBlocked: true }, 'unknown')).toBe('kicked');
  });
  it('использует серверную проверку, пока кэш пуст или неизвестен', () => {
    expect(dialogAccessStatus({ accessStatus: 'kicked' }, 'unknown')).toBe('kicked');
    expect(dialogAccessStatus({ accessStatus: 'error' })).toBe('error');
  });
  it('сохраняет явную проверку и не считает группу заблокировавшим пользователем', () => {
    expect(dialogAccessStatus({ accessStatus: 'error' }, 'available')).toBe('available');
    expect(dialogAccessStatus({ isGroup: true, isBlocked: true })).toBeUndefined();
  });
});
