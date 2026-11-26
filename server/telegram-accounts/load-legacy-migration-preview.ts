/** @fileoverview Чтение старых настроек Telegram для предварительного просмотра переноса. */
import { and, eq, gt, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
import { botTokens, projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import type { LegacyTelegramMigrationPlan } from '@shared/project-telegram-account-migration';
import { db } from '../database/db';
import type { ProjectTelegramAccountTransaction } from '../database/project-telegram-accounts-queries';
import { fingerprintLegacyTelegramSession } from './legacy-session-fingerprint';
import { planLegacyTelegramAccountMigration, type LegacyTelegramBotMetadata } from './legacy-migration-plan';

/**
 * Читает только относящиеся к переносу данные старых ботов проекта.
 * @param tx - Снимок базы данных.
 * @param projectId - Проект владельца.
 * @returns Метаданные без сессионных ключей и секретов Telegram API.
 */
async function readLocalBots(tx: ProjectTelegramAccountTransaction, projectId: number): Promise<LegacyTelegramBotMetadata[]> {
  const rows = await tx.select({
    projectId: botTokens.projectId,
    botId: botTokens.id,
    name: botTokens.name,
    session: botTokens.userbotSessionString,
    hasApiCredentials: sql<boolean>`coalesce(btrim(${botTokens.userbotApiId}) ~ '^[1-9][0-9]*$' and
      btrim(${botTokens.userbotApiHash}) ~ '^[[:xdigit:]]{32}$', false)`,
    linkedAccountId: projectTelegramAccountBots.accountId,
  }).from(botTokens)
    .leftJoin(projectTelegramAccountBots, and(
      eq(projectTelegramAccountBots.botTokenId, botTokens.id), eq(projectTelegramAccountBots.projectId, botTokens.projectId),
    ))
    .where(and(eq(botTokens.projectId, projectId), or(
      eq(botTokens.userbotEnabled, 1), isNotNull(botTokens.userbotSessionString), isNotNull(botTokens.userbotApiId),
    )));

  return rows.map(({ session, hasApiCredentials, ...bot }) => {
    const fingerprint = session ? fingerprintLegacyTelegramSession(session) : null;
    const problem = !session ? 'missing-session' : !fingerprint ? 'invalid-session'
      : !hasApiCredentials ? 'missing-api-credentials' : undefined;
    return { ...bot, fingerprint, problem };
  });
}

/**
 * Находит ключи кандидатов, которые встречаются в старых настройках других проектов.
 * @param tx - Снимок базы данных.
 * @param projectId - Проект владельца.
 * @param candidates - Отпечатки потенциально переносимых ключей.
 * @returns Внутренние метаданные для блокирования межпроектных совпадений.
 */
async function readForeignMatches(
  tx: ProjectTelegramAccountTransaction, projectId: number, candidates: ReadonlySet<string>,
): Promise<LegacyTelegramBotMetadata[]> {
  const matches = new Map<string, LegacyTelegramBotMetadata>();
  const batchSize = 500;
  let lastBotId = 0;
  while (matches.size < candidates.size) {
    const rows = await tx.select({
      projectId: botTokens.projectId, botId: botTokens.id, session: botTokens.userbotSessionString,
    }).from(botTokens).where(and(
      ne(botTokens.projectId, projectId), gt(botTokens.id, lastBotId), isNotNull(botTokens.userbotSessionString),
    )).orderBy(botTokens.id).limit(batchSize);
    for (const row of rows) {
      const fingerprint = row.session ? fingerprintLegacyTelegramSession(row.session) : null;
      if (fingerprint && candidates.has(fingerprint)) {
        matches.set(fingerprint, { projectId: row.projectId, botId: row.botId, name: '', fingerprint });
      }
    }
    if (rows.length < batchSize) break;
    lastBotId = rows[rows.length - 1].botId;
  }
  return [...matches.values()];
}

/**
 * Строит предварительный просмотр, исключая сетевые обращения и изменения базы.
 * @param projectId - Проверенный идентификатор проекта.
 * @returns Группы и причины исключения для владельца проекта.
 */
export function loadLegacyTelegramMigrationPreview(projectId: number): Promise<LegacyTelegramMigrationPlan> {
  return db.transaction(async tx => {
    const bots = await readLocalBots(tx, projectId);
    const candidates = new Set(bots.flatMap(bot => !bot.problem && bot.linkedAccountId == null && bot.fingerprint
      ? [bot.fingerprint] : []));
    if (!candidates.size) return planLegacyTelegramAccountMigration(projectId, bots);

    const foreignMatches = await readForeignMatches(tx, projectId, candidates);
    const owners = await tx.select({
      projectId: projectTelegramAccounts.projectId,
      accountId: projectTelegramAccounts.id,
      fingerprint: projectTelegramAccounts.sessionFingerprint,
      verifiedTelegramUserId: projectTelegramAccounts.telegramUserId,
    }).from(projectTelegramAccounts).where(inArray(projectTelegramAccounts.sessionFingerprint, [...candidates]));
    return planLegacyTelegramAccountMigration(projectId, [...bots, ...foreignMatches], owners.flatMap(owner =>
      owner.fingerprint ? [{ ...owner, fingerprint: owner.fingerprint }] : []));
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' });
}
