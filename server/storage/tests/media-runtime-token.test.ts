/** @fileoverview Проверки ограничения токена медиа конкретным проектом. */
import { describe, it, expect } from 'vitest';
import { createMediaRuntimeToken, verifyMediaRuntimeToken } from '../media-runtime-token';

describe('токен рабочего процесса', () => {
  it('не даёт доступ к другому проекту и отвергает неверный токен', () => {
    process.env.MEDIA_RUNTIME_SECRET = '0123456789abcdef0123456789abcdef';
    const token = createMediaRuntimeToken(12);
    expect(verifyMediaRuntimeToken(12, token)).toBe(true);
    expect(verifyMediaRuntimeToken(13, token)).toBe(false);
    expect(verifyMediaRuntimeToken(12, 'invalid')).toBe(false);
  });
  it('не создаёт токен без надёжного секрета', () => {
    delete process.env.MEDIA_RUNTIME_SECRET;
    expect(() => createMediaRuntimeToken(12)).toThrow();
  });
});
