/**
 * @fileoverview Ручной запуск общего построителя индекса сообщений.
 */
import 'dotenv/config';
import { ensureBotMessagesTimeIndex } from '../server/database/bot-messages-time-index';

/**
 * Запускает ту же проверку индекса, которую выполняет сервер в фоне.
 * @returns Завершение операции.
 */
async function main(): Promise<void> {
  const result = await ensureBotMessagesTimeIndex();
  if (result === 'busy') throw new Error('Индекс строит другой экземпляр сервера; повторите позже');
  console.log('idx_bot_messages_project_created_at: индекс готов');
}

main().catch((error: unknown) => {
  console.error('Создание индекса остановлено:', error);
  process.exitCode = 1;
});
