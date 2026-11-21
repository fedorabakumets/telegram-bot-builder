/** @fileoverview Блокирует несовместимый сценарий перед любым запуском общего аккаунта. */
import { unsupportedSharedTelegramNodes } from './project-telegram-scenario-compatibility';

/**
 * Читает привязку только при включённом общем клиенте, как и сборка окружения бота.
 * @param projectId - Проект запускаемого бота.
 * @param tokenId - Токен запускаемого бота.
 * @returns Привязка либо отсутствие общего клиента без обращения к новой схеме.
 */
async function resolveEnabledAccount(projectId: number, tokenId: number): Promise<number | undefined> {
  if (process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED !== '1') return undefined;
  return (await import('../database/project-telegram-accounts-store')).getProjectTelegramAccountIdForBot(projectId, tokenId);
}

/**
 * Проверяет привязку и сценарий без открытия Telegram-сессии.
 * @param projectId - Проект запускаемого бота.
 * @param tokenId - Токен запускаемого бота.
 * @param data - Сохранённый сценарий проекта.
 * @param resolveAccountId - Читает привязку, подменяется в изолированных тестах.
 * @returns Понятная ошибка с узлами либо отсутствие ошибки.
 */
export async function sharedTelegramStartError(
  projectId: number,
  tokenId: number,
  data: unknown,
  resolveAccountId: (projectId: number, tokenId: number) => Promise<number | undefined> = resolveEnabledAccount,
): Promise<string | undefined> {
  if (!await resolveAccountId(projectId, tokenId)) return undefined;
  const ids = unsupportedSharedTelegramNodes(data);
  return ids.length ? `Общий Telegram-аккаунт не поддерживает узлы сценария: ${ids.join(', ')}` : undefined;
}
