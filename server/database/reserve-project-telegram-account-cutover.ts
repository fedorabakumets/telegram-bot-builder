/** @fileoverview Создание пустого аккаунта и записи переноса одной транзакцией. */
import { sql } from 'drizzle-orm';
import { projectTelegramAccounts } from '@shared/schema';
import type { LegacyTelegramMigrationGroup } from '@shared/project-telegram-account-migration';
import type { TelegramAccountCutoverPhase, TelegramAccountCutoverPlan } from '../bots/telegram-account-cutover-types';
import { db } from './db';
import { lockTelegramAccountProject } from './project-telegram-accounts-queries';

/**
 * Возвращает недавние операции, чтобы владелец мог возобновить перенос после перезагрузки.
 * @param projectId - Проект владельца.
 * @returns Открытые идентификаторы и фазы операций.
 */
export async function listTelegramAccountCutovers(projectId: number) {
  const { rows } = await db.execute<{
    /** Стабильный идентификатор операции. */
    id: string;
    /** Карточка общего аккаунта. */
    account_id: number;
    /** Набор ботов в исходной группе. */
    bot_ids: number[];
    /** Зафиксированная фаза. */
    phase: TelegramAccountCutoverPhase;
  }>(sql`
    SELECT id, account_id, bot_ids, phase FROM project_telegram_account_cutovers
    WHERE project_id = ${projectId} ORDER BY updated_at DESC LIMIT 100
  `);
  return rows.map(row => ({
    migrationId: row.id, groupId: row.bot_ids[0], accountId: row.account_id, phase: row.phase,
  }));
}

/**
 * Читает уже зарегистрированный план проекта по идентификатору запроса.
 * @param projectId - Проект владельца.
 * @param id - Идентификатор запроса.
 * @param tx - Транзакция, если план читается при резервировании.
 * @returns Сохранённый план либо undefined.
 */
export async function getTelegramAccountCutoverPlan(
  projectId: number, id: string, tx: Pick<typeof db, 'execute'> = db,
): Promise<TelegramAccountCutoverPlan | undefined> {
  const { rows: [row] } = await tx.execute<{
    /** Целевая пустая карточка. */
    account_id: number;
    /** Боты из исходного предварительного просмотра. */
    bot_ids: number[];
  }>(sql`
    SELECT account_id, bot_ids FROM project_telegram_account_cutovers WHERE id = ${id} AND project_id = ${projectId}
  `);
  return row && { id, projectId, accountId: row.account_id, botIds: row.bot_ids };
}

/**
 * Регистрирует план с новой карточкой или возвращает прежний план того же запроса.
 * @param projectId - Проект владельца.
 * @param id - Постоянный идентификатор запроса.
 * @param group - Одобренная группа из свежего предварительного просмотра.
 * @returns План для оркестратора.
 */
export function reserveProjectTelegramAccountCutover(
  projectId: number, id: string, group: LegacyTelegramMigrationGroup,
): Promise<TelegramAccountCutoverPlan> {
  return db.transaction(async tx => {
    if (!(await lockTelegramAccountProject(tx, projectId))) throw new Error('Проект переноса не найден');
    const existing = await getTelegramAccountCutoverPlan(projectId, id, tx);
    if (existing) {
      if (existing.botIds[0] !== group.id) throw new Error('Запрос переноса относится к другой группе');
      return existing;
    }
    if (group.disposition !== 'create' || !group.botIds.length) throw new Error('Группа недоступна для переноса');
    const [account] = await tx.insert(projectTelegramAccounts)
      .values({ projectId, name: `Telegram · ${group.botNames[0]?.trim().slice(0, 80) || group.id}` })
      .returning({ id: projectTelegramAccounts.id });
    const botIds = [...group.botIds].sort((left, right) => left - right);
    const plan = { id, projectId, accountId: account.id, botIds };
    await tx.execute(sql`
      INSERT INTO project_telegram_account_cutovers (id, project_id, account_id, bot_ids, phase)
      VALUES (${id}, ${projectId}, ${account.id}, ${JSON.stringify(botIds)}::jsonb, 'prepared')
    `);
    return plan;
  });
}
