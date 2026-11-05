/** @fileoverview Повторный запуск бота после завершения предыдущего процесса. */
import { startBot } from './startBot';

/**
 * Запускает бота с ожиданием истечения блокировки после аварийной остановки.
 * @param projectId - Идентификатор проекта.
 * @param token - Токен Telegram-бота.
 * @param tokenId - Идентификатор токена.
 * @param clearLogs - Очистить ли журнал перед запуском.
 * @param launch - Функция запуска для проверки и подмены.
 * @returns Результат запуска.
 */
export function startBotAfterStop(
  projectId: number,
  token: string,
  tokenId: number,
  clearLogs = true,
  launch: typeof startBot = startBot,
): ReturnType<typeof startBot> {
  return launch(projectId, token, tokenId, { clearLogs, waitForExistingLock: true });
}
