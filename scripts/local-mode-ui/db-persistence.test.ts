/** @fileoverview Интеграционная проверка режима на временном неактивном боте только в локальной PostgreSQL. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

test('сохранение, сброс и конкурентное изменение режима в PostgreSQL', { timeout: 20000 }, async () => {
  const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(target.hostname), 'Проверка разрешена только для локальной БД');
  const { db, pool, closeDbPool } = await import('../../server/database/db');
  const { botProjects, botTokens, botEnvVariables } = await import('../../shared/schema');
  const { and, eq } = await import('drizzle-orm');
  const { getRuntimeModeSettings, saveRuntimeMode, saveRuntimeModeSettings } = await import('../../server/bots/runtimeModeSettings');
  let projectId: number | undefined;
  const previousMode = process.env.BOT_POLLING_MODE;
  const previousSelection = process.env.BOT_ON_DEMAND_TOKEN_IDS;
  process.env.BOT_POLLING_MODE = 'direct';
  delete process.env.BOT_ON_DEMAND_TOKEN_IDS;
  try {
    await pool.query('SELECT 1');
    const [project] = await db.insert(botProjects).values({ name: `mode-integration-${randomUUID()}`, data: { nodes: [], connections: [] } }).returning({ id: botProjects.id });
    projectId = project.id;
    const [token] = await db.insert(botTokens).values({ projectId, name: 'Неактивный интеграционный тест', token: `invalid-test-${randomUUID()}`, isActive: 0, autoRestart: 0, launchMode: 'polling' }).returning({ id: botTokens.id });
    const match = and(eq(botEnvVariables.tokenId, token.id), eq(botEnvVariables.key, 'BOT_POLLING_MODE'));
    for (const mode of ['direct', 'ondemand', 'process'] as const) {
      await saveRuntimeMode(token.id, mode, projectId);
      assert.equal((await getRuntimeModeSettings(token.id, projectId))?.mode, mode);
    }
    assert.equal(await getRuntimeModeSettings(token.id, projectId + 100000), null);
    await assert.rejects(db.insert(botEnvVariables).values({ tokenId: token.id, key: 'BOT_POLLING_MODE', value: 'ondemand' }));
    await saveRuntimeMode(token.id, 'process', projectId);
    assert.equal((await db.select().from(botEnvVariables).where(match)).length, 1);
    await assert.rejects(saveRuntimeMode(token.id, 'invalid', projectId));
    assert.equal((await getRuntimeModeSettings(token.id, projectId))?.mode, 'process');
    await saveRuntimeModeSettings(token.id, { mode: 'direct', launchMode: 'webhook', webhookBaseUrl: 'https://example.invalid' }, projectId);
    await assert.rejects(saveRuntimeMode(token.id, 'process', projectId));
    assert.deepEqual(await getRuntimeModeSettings(token.id, projectId), { mode: 'direct', source: 'bot', launchMode: 'webhook', requiresRestart: true });
    await saveRuntimeModeSettings(token.id, { launchMode: 'polling', resetMode: true }, projectId);
    assert.equal((await db.select().from(botEnvVariables).where(match)).length, 0);
    assert.equal((await getRuntimeModeSettings(token.id, projectId))?.source, 'server');
    for (let iteration = 0; iteration < 5; iteration++) {
      await saveRuntimeModeSettings(token.id, { launchMode: 'polling', mode: 'direct' }, projectId);
      const results = await Promise.allSettled([
        saveRuntimeModeSettings(token.id, { launchMode: 'webhook' }, projectId),
        saveRuntimeMode(token.id, 'process', projectId),
      ]);
      assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
      const final = await getRuntimeModeSettings(token.id, projectId);
      assert.ok(final?.launchMode === 'polling' || final?.mode === 'direct');
    }
    const [unchanged] = await db.select({ isActive: botTokens.isActive, autoRestart: botTokens.autoRestart }).from(botTokens).where(eq(botTokens.id, token.id));
    assert.deepEqual(unchanged, { isActive: 0, autoRestart: 0 });
  } finally {
    if (projectId !== undefined) await db.delete(botProjects).where(eq(botProjects.id, projectId));
    if (previousMode === undefined) delete process.env.BOT_POLLING_MODE; else process.env.BOT_POLLING_MODE = previousMode;
    if (previousSelection === undefined) delete process.env.BOT_ON_DEMAND_TOKEN_IDS; else process.env.BOT_ON_DEMAND_TOKEN_IDS = previousSelection;
    closeDbPool();
  }
});
