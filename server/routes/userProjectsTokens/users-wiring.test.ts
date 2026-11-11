/** @fileoverview Проверка фактического порядка защит в регистрации маршрутов пользователей. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';
import type { Express } from 'express';

it('маршруты пользователей и фотографии ограничивают запрос до актора и БД', async () => {
  const setupUrl = new URL('../setupUserProjectAndTokenRoutes.ts', import.meta.url);
  const source = await readFile(setupUrl, 'utf8');
  const handlers = new Map<string, ReturnType<typeof vi.fn>>();
  /** Подменяем зависимости регистрации, исключая запуск БД, очередей и Telegram. */
  for (const match of source.matchAll(/import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g)) {
    const exports = Object.fromEntries(match[1].split(',').map((entry) => {
      const name = entry.trim();
      const handler = vi.fn();
      handlers.set(name, handler);
      return [name, handler];
    }));
    vi.doMock(fileURLToPath(new URL(`${match[2]}.ts`, setupUrl)), () => exports);
  }
  const { setupUserProjectAndTokenRoutes } = await import('../setupUserProjectAndTokenRoutes');
  const app = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
  setupUserProjectAndTokenRoutes(app as unknown as Express);
  for (const [suffix, handler] of [['', 'getBotTokenUsersHandler'], ['/:userId', 'getBotTokenUserHandler'], ['/:userId/photo', 'getBotTokenUserPhotoHandler']]) {
    const registrations = app.get.mock.calls.filter(([path]) => path === `/api/bot/tokens/:tokenId/users${suffix}`);
    expect(registrations).toHaveLength(1);
    expect(registrations[0].slice(1)).toEqual([
      handlers.get('botUsersIpRateLimit'), handlers.get('resolveBotApiActor'),
      handlers.get('botUsersActorRateLimit'), handlers.get('requireBotUsersTokenAccess'), handlers.get(handler),
    ]);
  }
});
