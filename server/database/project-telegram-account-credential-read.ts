/** @fileoverview Чтение секретов аккаунта для внутреннего клиента Telegram. */
import { and, eq } from 'drizzle-orm';
import { projectTelegramAccountBots, projectTelegramAccounts } from '@shared/schema';
import type { ProjectTelegramAccountProxyInput } from '@shared/project-telegram-accounts';
import { db } from './db';
import {
  openProjectTelegramSecret, type ProjectTelegramAccountSecrets, type ProjectTelegramSessionSecret,
} from './project-telegram-account-secrets';

/** Выборка для серверного клиента, которая никогда не передаётся в API. */
const secretFields = {
  accountId: projectTelegramAccounts.id,
  sessionSecret: projectTelegramAccounts.sessionSecret,
  proxy: projectTelegramAccounts.proxy,
  proxySecret: projectTelegramAccounts.proxySecret,
};

/**
 * Открывает секреты аккаунта в ожидаемом контексте.
 * @param projectId - Проект аккаунта.
 * @param row - Строка с зашифрованными параметрами.
 * @returns Параметры для внутреннего клиента Telethon.
 */
function openSecrets(
  projectId: number, row: Pick<typeof projectTelegramAccounts.$inferSelect, 'proxy' | 'proxySecret' | 'sessionSecret'> & {
    /** Идентификатор карточки в результате запроса. */
    accountId: number;
  },
): ProjectTelegramAccountSecrets {
  const { accountId, proxy } = row;
  const session = openProjectTelegramSecret<ProjectTelegramSessionSecret>(projectId, accountId, 'session', row.sessionSecret);
  const proxyCredentials = openProjectTelegramSecret<Pick<ProjectTelegramAccountProxyInput, 'username' | 'password'>>(
    projectId, accountId, 'proxy', row.proxySecret,
  );
  return { session, proxy: proxy ? { type: proxy.type, host: proxy.host, port: proxy.port, ...proxyCredentials } : null };
}

/**
 * Возвращает серверные параметры, ограниченные аккаунтом проекта.
 * @param projectId - Проект для выборки.
 * @param accountId - Идентификатор карточки.
 * @returns Секреты для Telegram-клиента или undefined.
 */
export async function getProjectTelegramAccountSecrets(projectId: number, accountId: number) {
  const [row] = await db.select(secretFields).from(projectTelegramAccounts)
    .where(and(eq(projectTelegramAccounts.projectId, projectId), eq(projectTelegramAccounts.id, accountId)));
  return row ? openSecrets(projectId, row) : undefined;
}

/**
 * Проверяет актуальную привязку и получает параметры для запуска клиента.
 * @param projectId - Проект бота.
 * @param botTokenId - Идентификатор токена бота.
 * @returns Идентификатор аккаунта и секреты либо undefined.
 */
export async function getProjectTelegramAccountForBot(projectId: number, botTokenId: number) {
  const [row] = await db.select(secretFields).from(projectTelegramAccountBots)
    .innerJoin(projectTelegramAccounts, and(
      eq(projectTelegramAccountBots.projectId, projectTelegramAccounts.projectId),
      eq(projectTelegramAccountBots.accountId, projectTelegramAccounts.id),
    ))
    .where(and(
      eq(projectTelegramAccountBots.projectId, projectId), eq(projectTelegramAccountBots.botTokenId, botTokenId),
      eq(projectTelegramAccounts.sessionVerified, true),
    ));
  return row ? { accountId: row.accountId, ...openSecrets(projectId, row) } : undefined;
}
