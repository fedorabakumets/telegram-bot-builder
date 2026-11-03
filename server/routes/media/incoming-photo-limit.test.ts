/** @fileoverview Проверки отдельных токенов и настраиваемого лимита входящих фото. */
import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ redis: vi.fn() }));
vi.mock('../../redis/redisClient', () => ({ getRedisPublisher: mocks.redis }));
import { createMediaRuntimeToken, createMediaRuntimeWriteToken, verifyMediaRuntimeWriteToken } from '../../storage/media-runtime-token';
import { incomingPhotoRateLimit, incomingPhotoRetryAfter } from './incoming-photo-limit';

describe('ограничение приёма входящих фото', () => {
  it('не принимает токен чтения вместо токена записи', () => {
    const previous = process.env.MEDIA_RUNTIME_SECRET;
    process.env.MEDIA_RUNTIME_SECRET = 'x'.repeat(40);
    try {
      const write = createMediaRuntimeWriteToken(42);
      expect(verifyMediaRuntimeWriteToken(42, write)).toBe(true);
      expect(verifyMediaRuntimeWriteToken(42, createMediaRuntimeToken(42))).toBe(false);
      expect(verifyMediaRuntimeWriteToken(43, write)).toBe(false);
    } finally { if (previous === undefined) delete process.env.MEDIA_RUNTIME_SECRET; else process.env.MEDIA_RUNTIME_SECRET = previous; }
  });
  it('поддерживает настройку и использует атомарный счётчик Redis', async () => {
    expect(incomingPhotoRateLimit({ INCOMING_MEDIA_RATE_PER_HOUR: '12' })).toBe(12);
    expect(incomingPhotoRateLimit({})).toBe(3600);
    const evaluate = vi.fn().mockResolvedValue(25); mocks.redis.mockReturnValue({ eval: evaluate });
    expect(await incomingPhotoRetryAfter(725)).toBe(25);
    expect(evaluate).toHaveBeenCalledWith(expect.any(String), 1, 'incoming-photo-rate:725', '3600', '3600');
  });
  it('сохраняет локальную защиту при недоступном Redis', async () => {
    mocks.redis.mockReturnValue(null);
    const prev = process.env.INCOMING_MEDIA_RATE_PER_HOUR; process.env.INCOMING_MEDIA_RATE_PER_HOUR = '2';
    try {
      expect(await incomingPhotoRetryAfter(726, 100)).toBe(0);
      expect(await incomingPhotoRetryAfter(726, 101)).toBe(0);
      expect(await incomingPhotoRetryAfter(726, 102)).toBe(3600);
      expect(await incomingPhotoRetryAfter(726, 3600100)).toBe(0);
    } finally { if (prev === undefined) delete process.env.INCOMING_MEDIA_RATE_PER_HOUR; else process.env.INCOMING_MEDIA_RATE_PER_HOUR = prev; }
  });
});
