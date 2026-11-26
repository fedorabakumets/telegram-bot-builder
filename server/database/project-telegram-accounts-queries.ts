/** @fileoverview Общие запросы проектных Telegram-аккаунтов и безопасная проекция для API. */
import { and, asc, eq } from 'drizzle-orm';
import { botProjects, projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import type { ProjectTelegramAccount } from '@shared/project-telegram-accounts';
import { db } from './db';

/** Транзакция, переданная из общего подключения к базе. */
export type ProjectTelegramAccountTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Поля, которые разрешено выбирать для выдачи в API. */
const publicFields = {
  id: projectTelegramAccounts.id,
  projectId: projectTelegramAccounts.projectId,
  name: projectTelegramAccounts.name,
  maskedPhone: projectTelegramAccounts.maskedPhone,
  telegramUserId: projectTelegramAccounts.telegramUserId,
  telegramName: projectTelegramAccounts.telegramName,
  telegramUsername: projectTelegramAccounts.telegramUsername,
  sessionKind: projectTelegramAccounts.sessionKind,
  sessionVerified: projectTelegramAccounts.sessionVerified,
  proxy: projectTelegramAccounts.proxy,
  botId: projectTelegramAccountBots.botTokenId,
};

/**
 * Блокирует изменения аккаунтов и привязок выбранного проекта на время транзакции.
 * @param tx - Текущая транзакция.
 * @param projectId - Идентификатор проекта.
 * @returns Существует ли проект.
 */
export async function lockTelegramAccountProject(tx: ProjectTelegramAccountTransaction, projectId: number): Promise<boolean> {
  const [project] = await tx.select({ id: botProjects.id }).from(botProjects).where(eq(botProjects.id, projectId)).for('update');
  return !!project;
}

/**
 * Возвращает карточки без доступа к зашифрованным полям.
 * @param projectId - Проект для выборки.
 * @param accountId - При наличии ограничивает выборку одной карточкой.
 * @param connection - Общее подключение либо текущая транзакция.
 * @returns Карточки с идентификаторами связанных ботов.
 */
export async function readProjectTelegramAccounts(
  projectId: number, accountId?: number, connection: typeof db | ProjectTelegramAccountTransaction = db,
): Promise<ProjectTelegramAccount[]> {
  const rows = await connection.select(publicFields).from(projectTelegramAccounts)
    .leftJoin(projectTelegramAccountBots, and(
      eq(projectTelegramAccountBots.projectId, projectTelegramAccounts.projectId),
      eq(projectTelegramAccountBots.accountId, projectTelegramAccounts.id),
    ))
    .where(and(eq(projectTelegramAccounts.projectId, projectId),
      accountId === undefined ? undefined : eq(projectTelegramAccounts.id, accountId)))
    .orderBy(asc(projectTelegramAccounts.id), asc(projectTelegramAccountBots.botTokenId));

  const accounts = new Map<number, ProjectTelegramAccount>();
  for (const { botId, sessionVerified, ...value } of rows) {
    let account = accounts.get(value.id);
    if (!account) {
      account = { ...value, status: sessionVerified ? 'connected' : 'disconnected', botIds: [] };
      accounts.set(value.id, account);
    }
    if (botId !== null) account.botIds.push(botId);
  }
  return [...accounts.values()];
}
