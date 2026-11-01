/** @fileoverview Проверки изоляции токенов чтения медиа по проекту и окружению. */
import { it, expect, vi } from 'vitest';
import { resolveDevMediaToken } from './dev-media-token';
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(async () => JSON.stringify([{ id: 9, project_id: 12, token: '123456:example' }])) }));
it('разрешает чтение только для указанного токена и проекта в dev', async () => {
  vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DEV_TELEGRAM_MEDIA_TOKENS_FILE', 'private.json');
  try {
    expect(await resolveDevMediaToken(12, 9)).toBe('123456:example');
    expect(await resolveDevMediaToken(13, 9)).toBeNull();
    expect(await resolveDevMediaToken(12, 10)).toBeNull();
    vi.stubEnv('NODE_ENV', 'production');
    expect(await resolveDevMediaToken(12, 9)).toBeNull();
  } finally { vi.unstubAllEnvs(); }
});
