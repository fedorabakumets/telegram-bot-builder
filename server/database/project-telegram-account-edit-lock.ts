/** @fileoverview Блокировка обычных изменений на время переноса Telegram-аккаунта. */
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import type { ProjectTelegramAccountTransaction } from './project-telegram-accounts-queries';

/** Ошибка при обычном изменении проекта во время незавершённого переноса. */
export class ProjectTelegramAccountCutoverActiveError extends Error {
  /** Создаёт безопасное для API описание ошибки. */
  constructor() {
    super('В проекте выполняется перенос Telegram-аккаунта');
  }
}

/** Ошибка изменения аккаунта без предварительного освобождения привязок. */
export class ProjectTelegramAccountUnavailableForEditError extends Error {
  /** Создаёт безопасное для API описание ошибки. */
  constructor() {
    super('Прокси и удаление доступны для карточки без сохранённой сессии и привязок');
  }
}

/**
 * Защищает прокси и удаление от привязанного или уже запущенного клиента.
 * @param tx - Транзакция с захваченной строкой проекта.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор карточки.
 */
export async function assertProjectTelegramAccountUnbound(
  tx: ProjectTelegramAccountTransaction, projectId: number, accountId: number,
): Promise<void> {
  const [binding] = await tx.select({ id: projectTelegramAccountBots.botTokenId }).from(projectTelegramAccountBots)
    .where(and(eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.accountId, accountId))).limit(1);
  if (binding) throw new ProjectTelegramAccountUnavailableForEditError();
  const [session] = await tx.select({ id: projectTelegramAccounts.id }).from(projectTelegramAccounts)
    .where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId),
      isNotNull(projectTelegramAccounts.sessionSecret))).limit(1);
  if (session) throw new ProjectTelegramAccountUnavailableForEditError();
}

/**
 * Прерывает обычную запись, если есть незавершённый перенос.
 * @param tx - Транзакция с захваченной строкой проекта.
 * @param projectId - Проект аккаунта.
 */
export async function assertProjectTelegramAccountEditable(tx: ProjectTelegramAccountTransaction, projectId: number): Promise<void> {
  const cutover = await tx.execute(sql`
    SELECT id FROM project_telegram_account_cutovers
    WHERE project_id = ${projectId} AND phase NOT IN ('shared-ready', 'rolled-back')
    LIMIT 1
  `);
  if (cutover.rows.length) throw new ProjectTelegramAccountCutoverActiveError();
}
