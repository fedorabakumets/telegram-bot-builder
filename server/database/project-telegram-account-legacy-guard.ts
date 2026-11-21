/** @fileoverview Защита от запуска старой копии уже перенесённой сессии Telegram. */
import { and, eq, sql } from 'drizzle-orm';
import { botTokens, projectTelegramAccounts } from '@shared/schema';
import { db } from './db';
import { fingerprintLegacyTelegramSession } from '../telegram-accounts/legacy-session-fingerprint';

/**
 * Проверяет, что индивидуальная сессия бота не принадлежит общему аккаунту.
 * @param projectId - Проект бота.
 * @param botTokenId - Идентификатор токена.
 * @param legacySessionString - Уже считанная сессия или отсутствие значения для отдельной выборки.
 * @returns Запрещено ли передавать старые параметры в среду запуска.
 */
export async function isProjectTelegramLegacySessionBlocked(
  projectId: number, botTokenId: number, legacySessionString?: string | null,
): Promise<boolean> {
  try {
    const cutover = await db.execute(sql`
      SELECT id FROM project_telegram_account_cutovers
      WHERE project_id = ${projectId} AND phase = 'shared-ready'
        AND bot_ids @> jsonb_build_array(${botTokenId}::int)
      LIMIT 1
    `);
    if (cutover.rows.length) return true;

    let session = legacySessionString;
    if (session === undefined) {
      const [record] = await db.select({ session: botTokens.userbotSessionString }).from(botTokens)
        .where(and(eq(botTokens.projectId, projectId), eq(botTokens.id, botTokenId)));
      session = record?.session;
    }
    const fingerprint = session ? fingerprintLegacyTelegramSession(session) : null;
    if (!fingerprint) return false;
    const [owner] = await db.select({ id: projectTelegramAccounts.id }).from(projectTelegramAccounts)
      .where(eq(projectTelegramAccounts.sessionFingerprint, fingerprint)).limit(1);
    return !!owner;
  } catch (error) {
    const pg = error as {
      /** Код ошибки PostgreSQL. */
      code?: string;
      /** Сообщение драйвера. */
      message?: string;
      /** Причина при обёртывании ошибки в Drizzle. */
      cause?: { /** Код ошибки PostgreSQL. */ code?: string; /** Сообщение драйвера. */ message?: string };
    };
    const cause = pg.cause ?? pg;
    if (cause.code === '42P01' && /relation "(?:public\.)?project_telegram_account(?:s|_cutovers)"/.test(cause.message ?? '')) return false;
    throw error;
  }
}
