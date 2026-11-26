/** @fileoverview Хранение зашифрованных параметров подключения проектных Telegram-аккаунтов. */
import { and, eq, isNotNull } from 'drizzle-orm';
import { botTokens, projectTelegramAccounts } from '@shared/schema';
import type { ProjectTelegramAccount, ProjectTelegramAccountProxyInput } from '@shared/project-telegram-accounts';
import { db } from './db';
import { lockTelegramAccountProject, readProjectTelegramAccounts } from './project-telegram-accounts-queries';
import {
  maskProjectTelegramPhone, sealProjectTelegramSecret, type ProjectTelegramSessionInput,
} from './project-telegram-account-secrets';
import { fingerprintLegacyTelegramSession } from '../telegram-accounts/legacy-session-fingerprint';
import { assertProjectTelegramAccountEditable, assertProjectTelegramAccountUnbound } from './project-telegram-account-edit-lock';

/** Ошибка повторного использования одного ключа авторизации. */
export class DuplicateProjectTelegramSessionError extends Error {
  /** Возвращает сообщение, не раскрывающее ключ и владельца другого проекта. */
  constructor() {
    super('Эта сессия Telegram уже подключена');
  }
}

/** Ошибка замены уже назначенной сессии без переноса работающих клиентов. */
export class ProjectTelegramSessionReplacementError extends Error {
  /** Создаёт безопасное для API описание ошибки. */
  constructor() {
    super('Сессия аккаунта уже настроена');
  }
}

/**
 * Записывает подтверждённую сессию в карточку проекта.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор карточки.
 * @param input - Параметры подтверждённой сессии и профиль Telegram.
 * @returns Обновлённая карточка без секретов или undefined.
 */
export async function setProjectTelegramAccountSession(
  projectId: number, accountId: number, input: ProjectTelegramSessionInput,
): Promise<ProjectTelegramAccount | undefined> {
  const fingerprint = fingerprintLegacyTelegramSession(input.sessionString);
  if (!fingerprint) throw new Error('Некорректная строка сессии Telegram');
  const { apiId, apiHash, sessionString, phone } = input;
  const sessionSecret = sealProjectTelegramSecret(projectId, accountId, 'session', { apiId, apiHash, sessionString, phone });
  try {
    return await db.transaction(async tx => {
      if (!(await lockTelegramAccountProject(tx, projectId))) return undefined;
      await assertProjectTelegramAccountEditable(tx, projectId);
      const [current] = await tx.select({ fingerprint: projectTelegramAccounts.sessionFingerprint })
        .from(projectTelegramAccounts).where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId)));
      if (!current) return undefined;
      if (current.fingerprint === fingerprint) return (await readProjectTelegramAccounts(projectId, accountId, tx))[0];
      if (current.fingerprint) throw new ProjectTelegramSessionReplacementError();
      const legacy = await tx.select({ session: botTokens.userbotSessionString }).from(botTokens)
        .where(isNotNull(botTokens.userbotSessionString));
      if (legacy.some(row => row.session && fingerprintLegacyTelegramSession(row.session) === fingerprint)) {
        throw new DuplicateProjectTelegramSessionError();
      }
      const [updated] = await tx.update(projectTelegramAccounts).set({
        sessionSecret, sessionFingerprint: fingerprint, sessionKind: input.sessionKind,
        sessionVerified: input.sessionKind === 'phone',
        maskedPhone: input.phone !== undefined || input.maskedPhone !== undefined
          ? maskProjectTelegramPhone(input.phone ?? input.maskedPhone)
          : undefined,
        telegramUserId: input.telegramUserId ?? null, telegramName: input.telegramName ?? null,
        telegramUsername: input.telegramUsername ?? null, updatedAt: new Date(),
      }).where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId)))
        .returning({ id: projectTelegramAccounts.id });
      return updated ? (await readProjectTelegramAccounts(projectId, accountId, tx))[0] : undefined;
    });
  } catch (error) {
    const pg = (error as { /** Ошибка драйвера. */ cause?: { /** Имя нарушения уникальности. */ constraint?: string } }).cause;
    if (pg?.constraint === 'project_telegram_accounts_session_fingerprint') throw new DuplicateProjectTelegramSessionError();
    throw error;
  }
}

/**
 * Записывает прокси и его отдельный зашифрованный секрет.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор карточки.
 * @param input - Проверенные параметры прокси или null для отключения.
 * @returns Обновлённая карточка без секретов или undefined.
 */
export function setProjectTelegramAccountProxy(
  projectId: number, accountId: number, input: ProjectTelegramAccountProxyInput | null,
): Promise<ProjectTelegramAccount | undefined> {
  const proxy = input ? { type: input.type, host: input.host, port: input.port, hasPassword: !!(input.username || input.password) } : null;
  const proxySecret = proxy?.hasPassword ? sealProjectTelegramSecret(projectId, accountId, 'proxy', {
    username: input?.username, password: input?.password,
  }) : null;
  return db.transaction(async tx => {
    if (!(await lockTelegramAccountProject(tx, projectId))) return undefined;
    await assertProjectTelegramAccountEditable(tx, projectId);
    await assertProjectTelegramAccountUnbound(tx, projectId, accountId);
    const [updated] = await tx.update(projectTelegramAccounts).set({ proxy, proxySecret, updatedAt: new Date() })
      .where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId)))
      .returning({ id: projectTelegramAccounts.id });
    return updated ? (await readProjectTelegramAccounts(projectId, accountId, tx))[0] : undefined;
  });
}

/**
 * Отмечает только ту сессию, для которой общий клиент подтвердил авторизацию.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор карточки.
 * @param sessionString - Сессия, которую проверил общий клиент.
 * @param profile - Подтверждённые сведения об аккаунте.
 * @returns Обновлённая карточка или undefined, если сессия изменилась.
 */
export function confirmProjectTelegramAccountSession(
  projectId: number, accountId: number, sessionString: string,
  profile: Pick<ProjectTelegramSessionInput, 'telegramUserId' | 'telegramName' | 'telegramUsername' | 'phone' | 'maskedPhone'> = {},
): Promise<ProjectTelegramAccount | undefined> {
  const fingerprint = fingerprintLegacyTelegramSession(sessionString);
  if (!fingerprint) return Promise.resolve(undefined);
  return db.transaction(async tx => {
    if (!(await lockTelegramAccountProject(tx, projectId))) return undefined;
    const [updated] = await tx.update(projectTelegramAccounts).set({
      sessionVerified: true, updatedAt: new Date(),
      maskedPhone: profile.phone || profile.maskedPhone ? maskProjectTelegramPhone(profile.phone ?? profile.maskedPhone) : undefined,
      telegramName: profile.telegramName, telegramUsername: profile.telegramUsername, telegramUserId: profile.telegramUserId,
    }).where(and(eq(projectTelegramAccounts.projectId, projectId),
      eq(projectTelegramAccounts.id, accountId), eq(projectTelegramAccounts.sessionFingerprint, fingerprint))
    ).returning({ id: projectTelegramAccounts.id });
    return updated ? (await readProjectTelegramAccounts(projectId, accountId, tx))[0] : undefined;
  });
}
