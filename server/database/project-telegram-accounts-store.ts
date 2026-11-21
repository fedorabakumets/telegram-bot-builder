/** @fileoverview Хранилище карточек проектных Telegram-аккаунтов и привязок ботов. */
import { and, eq, inArray, sql } from 'drizzle-orm';
import { botTokens, projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import type { ProjectTelegramAccount } from '@shared/project-telegram-accounts';
import { db } from './db';
import { lockTelegramAccountProject, readProjectTelegramAccounts } from './project-telegram-accounts-queries';
import { maskProjectTelegramPhone } from './project-telegram-account-secrets';
import { assertProjectTelegramAccountEditable, assertProjectTelegramAccountUnbound } from './project-telegram-account-edit-lock';

export {
  DuplicateProjectTelegramSessionError, ProjectTelegramSessionReplacementError,
  setProjectTelegramAccountProxy, setProjectTelegramAccountSession, confirmProjectTelegramAccountSession,
} from './project-telegram-account-credential-store';
export { getProjectTelegramAccountSecrets, getProjectTelegramAccountForBot } from './project-telegram-account-credential-read';
export { ProjectTelegramAccountCutoverActiveError, ProjectTelegramAccountUnavailableForEditError } from './project-telegram-account-edit-lock';
export { isProjectTelegramLegacySessionBlocked } from './project-telegram-account-legacy-guard';

/** Поля создания карточки. */
export interface CreateProjectTelegramAccountInput {
  /** Название новой карточки. */
  name: string;
  /** Уже маскированный номер или телефон, который будет преобразован перед записью. */
  maskedPhone?: string;
}

/** Ошибка при выборе бота, который не принадлежит проекту. */
export class InvalidProjectTelegramAccountBotsError extends Error {
  /** Создаёт безопасное для API описание ошибки. */
  constructor() {
    super('Один или несколько ботов не принадлежат проекту');
  }
}

/** Перенесённая привязка меняется только операцией, которая координирует запуск Telegram. */
export class ProjectTelegramAccountBindingLockedError extends Error {
  /** Создаёт безопасное описание причины блокировки. */
  constructor() {
    super('Чтобы изменить перенесённую привязку, сначала выполните откат переноса');
  }
}

/** Привязка возможна после подключения аккаунта. */
export class ProjectTelegramAccountAuthorizationRequiredError extends Error {
  /** Создаёт безопасное описание причины блокировки. */
  constructor() {
    super('Сначала подключите Telegram-аккаунт');
  }
}

/**
 * Список аккаунтов проекта.
 * @param projectId - Проект для выборки.
 * @returns Карточки аккаунтов без секретов.
 */
export function listProjectTelegramAccounts(projectId: number): Promise<ProjectTelegramAccount[]> {
  return readProjectTelegramAccounts(projectId);
}

/**
 * Возвращает карточку аккаунта проекта.
 * @param projectId - Проект для выборки.
 * @param accountId - Идентификатор аккаунта.
 * @returns Карточка аккаунта или undefined.
 */
export async function getProjectTelegramAccount(projectId: number, accountId: number): Promise<ProjectTelegramAccount | undefined> {
  return (await readProjectTelegramAccounts(projectId, accountId))[0];
}

/**
 * Возвращает привязку для запуска бота без чтения секретов Telegram.
 * @param projectId - Проект бота.
 * @param botTokenId - Идентификатор токена бота.
 * @returns Идентификатор аккаунта или undefined.
 */
export async function getProjectTelegramAccountIdForBot(projectId: number, botTokenId: number): Promise<number | undefined> {
  const [row] = await db.select({ accountId: projectTelegramAccountBots.accountId })
    .from(projectTelegramAccountBots).where(and(
      eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.botTokenId, botTokenId),
    ));
  return row?.accountId;
}

/**
 * Создаёт пустую карточку без сессии.
 * @param projectId - Проект для записи.
 * @param input - Название и необязательный номер.
 * @returns Созданная карточка.
 */
export async function createProjectTelegramAccount(projectId: number, input: CreateProjectTelegramAccountInput): Promise<ProjectTelegramAccount> {
  const maskedPhone = maskProjectTelegramPhone(input.maskedPhone);
  const [account] = await db.insert(projectTelegramAccounts).values({ projectId, name: input.name, maskedPhone })
    .returning({ id: projectTelegramAccounts.id, name: projectTelegramAccounts.name });
  return {
    ...account, projectId, maskedPhone, telegramUserId: null, telegramName: null, telegramUsername: null,
    status: 'disconnected', botIds: [], sessionKind: null, proxy: null,
  };
}

/**
 * Заменяет привязки аккаунта одной транзакцией и переносит выбранных ботов.
 * @param projectId - Проект аккаунта и ботов.
 * @param accountId - Идентификатор аккаунта.
 * @param botIds - Полный набор идентификаторов ботов для выбранного аккаунта.
 * @returns Обновлённая карточка или undefined.
 */
export function setProjectTelegramAccountBots(projectId: number, accountId: number, botIds: number[]) {
  return db.transaction(async tx => {
    if (!(await lockTelegramAccountProject(tx, projectId))) return undefined;
    await assertProjectTelegramAccountEditable(tx, projectId);
    const [account] = await readProjectTelegramAccounts(projectId, accountId, tx);
    if (!account) return undefined;

    const selectedIds = [...new Set(botIds)];
    if (selectedIds.length && account.status !== 'connected') throw new ProjectTelegramAccountAuthorizationRequiredError();
    const cutovers = await tx.execute<{ account_id: number; bot_ids: number[] }>(sql`
      SELECT account_id, bot_ids FROM project_telegram_account_cutovers WHERE project_id = ${projectId} AND phase = 'shared-ready'
    `);
    if (cutovers.rows.some(cutover => cutover.account_id === accountId
      ? cutover.bot_ids.some(botId => !selectedIds.includes(botId))
      : cutover.bot_ids.some(botId => selectedIds.includes(botId)))) {
      throw new ProjectTelegramAccountBindingLockedError();
    }
    if (selectedIds.length) {
      const tokens = await tx.select({ id: botTokens.id }).from(botTokens)
        .where(and(eq(botTokens.projectId, projectId), inArray(botTokens.id, selectedIds)));
      if (tokens.length !== selectedIds.length) throw new InvalidProjectTelegramAccountBotsError();
    }

    await tx.delete(projectTelegramAccountBots).where(and(
      eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.accountId, accountId),
    ));
    if (selectedIds.length) {
      await tx.insert(projectTelegramAccountBots).values(selectedIds.map(botTokenId => ({ projectId, accountId, botTokenId })))
        .onConflictDoUpdate({ target: projectTelegramAccountBots.botTokenId, set: { accountId } });
    }
    return { ...account, botIds: selectedIds.sort((a, b) => a - b) };
  });
}

/**
 * Удаляет аккаунт и его привязки из проекта.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор аккаунта.
 * @returns Был ли удалён аккаунт.
 */
export function deleteProjectTelegramAccount(projectId: number, accountId: number) {
  return db.transaction(async tx => {
    if (!(await lockTelegramAccountProject(tx, projectId))) return false;
    await assertProjectTelegramAccountEditable(tx, projectId);
    await assertProjectTelegramAccountUnbound(tx, projectId, accountId);
    const deleted = await tx.delete(projectTelegramAccounts).where(and(
      eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId),
    )).returning({ id: projectTelegramAccounts.id });
    return deleted.length > 0;
  });
}
