/**
 * @fileoverview Перезапуск бота по projectId и tokenId (регенерация Python из шаблонов)
 */
import { stopBot } from '../server/bots/stopBot';
import { startBot } from '../server/bots/startBot';
import { storage } from '../server/storages/storage';

/**
 * Останавливает и запускает бота заново
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 */
async function restartBotToken(projectId: number, tokenId: number): Promise<void> {
  const tokenRow = await storage.getBotToken(tokenId);
  if (!tokenRow?.token) {
    throw new Error(`Токен ${tokenId} не найден`);
  }

  const stop = await stopBot(projectId, tokenId);
  console.log('stop:', stop);

  await new Promise((r) => setTimeout(r, 1500));

  const start = await startBot(projectId, tokenRow.token, tokenId);
  console.log('start:', start);

  if (!start.success) {
    process.exit(1);
  }
}

const projectId = parseInt(process.argv[2] || '', 10);
const tokenId = parseInt(process.argv[3] || '', 10);

if (!projectId || !tokenId) {
  console.error('Использование: npx tsx scripts/restart-bot-token.ts <projectId> <tokenId>');
  process.exit(1);
}

restartBotToken(projectId, tokenId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
