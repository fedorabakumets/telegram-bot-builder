/** @fileoverview Атомарная запись и откат привязок, принадлежащих переносу Telegram. */
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { botTokens, projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import { db } from './db';
import { lockTelegramAccountProject, type ProjectTelegramAccountTransaction } from './project-telegram-accounts-queries';
import { sealProjectTelegramSecret } from './project-telegram-account-secrets';
import { telegramCutoverLockNamespace } from './project-telegram-account-cutover-journal';
import { fingerprintLegacyTelegramSession } from '../telegram-accounts/legacy-session-fingerprint';
import type { TelegramAccountCutoverExecution } from '../bots/telegram-account-cutover-types';

/** Метка атомарной установки. Хранит только результат операций над карточкой. */
interface BindingInstall {
  /** Сессия создана во время переноса, а не существовала до начала. */
  installedSession: boolean;
  /** Откат привязок уже выполнен. */
  restored?: boolean;
}

/**
 * Перепроверяет контекст и блокирует запись журнала на время мутации.
 * @param tx - Транзакция изменения привязок.
 * @param execution - План и маркер захваченного журнала.
 * @param phase - Фаза, разрешающая данное действие.
 * @returns Текущая метка атомарной установки.
 */
async function lockBindingJournal(
  tx: ProjectTelegramAccountTransaction, { plan, fence }: TelegramAccountCutoverExecution,
  phase: 'legacy-stopped' | 'shared-stopped',
): Promise<BindingInstall | null> {
  if (!(await lockTelegramAccountProject(tx, plan.projectId))) throw new Error('Проект переноса не найден');
  const { rows: [row] } = await tx.execute<{ binding: BindingInstall | null }>(sql`
    SELECT runtime_state -> 'bindingInstall' AS binding FROM project_telegram_account_cutovers c
    WHERE c.id = ${plan.id} AND c.project_id = ${plan.projectId} AND c.account_id = ${plan.accountId}
      AND c.bot_ids = ${JSON.stringify(plan.botIds)}::jsonb AND c.execution_fence = ${fence} AND c.phase = ${phase}
      AND EXISTS (
        SELECT 1 FROM pg_locks l WHERE l.pid = c.execution_backend_pid
          AND l.locktype = 'advisory' AND l.granted AND l.objsubid = 2
          AND l.classid = ${telegramCutoverLockNamespace}::oid AND l.objid = c.project_id::oid
          AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      )
    FOR UPDATE
  `);
  if (!row) throw new Error('Захват переноса устарел');
  return row.binding;
}

/**
 * Обновляет только метку привязок, сохраняя исходные намерения запуска.
 * @param tx - Текущая транзакция.
 * @param id - Идентификатор операции.
 * @param binding - Запись установки привязок.
 */
async function saveBindingMarker(tx: ProjectTelegramAccountTransaction, id: string, binding: BindingInstall) {
  await tx.execute(sql`
    UPDATE project_telegram_account_cutovers
    SET runtime_state = jsonb_set(COALESCE(runtime_state, '{}'::jsonb), '{bindingInstall}', ${JSON.stringify(binding)}::jsonb)
    WHERE id = ${id}
  `);
}

/**
 * Устанавливает привязки после подтверждённой остановки старых клиентов.
 * @param execution - Захваченный журнал и точный набор ботов.
 */
export function installProjectTelegramAccountCutoverBindings(execution: TelegramAccountCutoverExecution): Promise<void> {
  const { plan: { projectId, accountId, botIds, id } } = execution;
  return db.transaction(async tx => {
    if (await lockBindingJournal(tx, execution, 'legacy-stopped')) return;
    const planned = [...botIds];
    const sources = await tx.select({
      id: botTokens.id, apiId: botTokens.userbotApiId, apiHash: botTokens.userbotApiHash, sessionString: botTokens.userbotSessionString,
    }).from(botTokens).where(and(eq(botTokens.projectId, projectId), inArray(botTokens.id, planned))).for('update');
    const source = sources[0];
    const fingerprint = source?.sessionString ? fingerprintLegacyTelegramSession(source.sessionString) : null;
    if (!source?.sessionString || !source.apiId || !source.apiHash || !fingerprint || sources.length !== planned.length
      || sources.some(row => !row.sessionString || fingerprintLegacyTelegramSession(row.sessionString) !== fingerprint)) {
      throw new Error('Старые настройки Telegram изменились после проверки');
    }
    const allLegacy = await tx.select({
      id: botTokens.id, projectId: botTokens.projectId, session: botTokens.userbotSessionString,
      linkedAccountId: projectTelegramAccountBots.accountId,
    }).from(botTokens).leftJoin(projectTelegramAccountBots, and(
      eq(projectTelegramAccountBots.botTokenId, botTokens.id), eq(projectTelegramAccountBots.projectId, botTokens.projectId),
    )).where(isNotNull(botTokens.userbotSessionString));
    if (allLegacy.some(row => row.session && fingerprintLegacyTelegramSession(row.session) === fingerprint
      && (row.projectId !== projectId || (!planned.includes(row.id) && row.linkedAccountId !== accountId)))) {
      throw new Error('Ключ Telegram используется в неперенесённой привязке');
    }

    const accountScope = and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId));
    const [account] = await tx.select({ fingerprint: projectTelegramAccounts.sessionFingerprint })
      .from(projectTelegramAccounts).where(accountScope);
    if (!account || (account.fingerprint && account.fingerprint !== fingerprint)) {
      throw new Error('Целевой Telegram-аккаунт больше не соответствует плану');
    }
    const installedSession = !account.fingerprint;
    if (installedSession) {
      const sessionSecret = sealProjectTelegramSecret(projectId, accountId, 'session', {
        apiId: source.apiId, apiHash: source.apiHash, sessionString: source.sessionString,
      });
      await tx.update(projectTelegramAccounts).set({
        sessionSecret, sessionFingerprint: fingerprint, sessionKind: 'legacy', sessionVerified: false, updatedAt: new Date(),
      }).where(accountScope);
    }
    /** Первичная установка ожидает, что ни один бот не имеет привязки. */
    await tx.insert(projectTelegramAccountBots).values(planned.map(botTokenId => ({ projectId, accountId, botTokenId })));
    await saveBindingMarker(tx, id, { installedSession });
  });
}

/**
 * Удаляет только записи, добавленные этим переносом, после остановки общего клиента.
 * @param execution - Захваченный журнал и исходный план.
 */
export function restoreProjectTelegramAccountCutoverBindings(execution: TelegramAccountCutoverExecution): Promise<void> {
  const { plan: { projectId, accountId, botIds, id } } = execution;
  return db.transaction(async tx => {
    const binding = await lockBindingJournal(tx, execution, 'shared-stopped');
    if (!binding || binding.restored) return;
    const removed = await tx.delete(projectTelegramAccountBots).where(and(
      eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.accountId, accountId),
      inArray(projectTelegramAccountBots.botTokenId, [...botIds]),
    )).returning({ id: projectTelegramAccountBots.botTokenId });
    if (removed.length !== botIds.length) throw new Error('Привязки переноса были изменены после установки');
    if (binding.installedSession) {
      const [other] = await tx.select({ id: projectTelegramAccountBots.botTokenId }).from(projectTelegramAccountBots)
        .where(and(eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.accountId, accountId))).limit(1);
      if (other) throw new Error('Целевой аккаунт используется ботом вне плана переноса');
      await tx.update(projectTelegramAccounts).set({
        sessionSecret: null, sessionFingerprint: null, sessionKind: null, sessionVerified: false, updatedAt: new Date(),
      }).where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId)));
    }
    await saveBindingMarker(tx, id, { ...binding, restored: true });
  });
}
