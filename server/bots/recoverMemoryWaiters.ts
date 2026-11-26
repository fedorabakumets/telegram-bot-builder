/** @fileoverview Восстанавливает желаемые running-боты после отказа допуска памяти исполнителя. */
import { storage } from '../storages/storage';
import { startBot } from './startBot';
import { automaticBotStartAllowed } from './automaticBotStartAllowed';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import { isServerShuttingDown } from './serverShutdownState';
import { isMemoryRefusalReason } from './workerMemoryRefusal';
import { MemoryRecoveryQueue } from './memoryRecoveryQueue';

/** Обход кандидатов без повторного захвата общего ограничителя startBot. */
const queue = new MemoryRecoveryQueue();

/** Проверяет свежие намерения и восстанавливает до пяти токенов параллельно; допуск памяти выполняет runner. */
export async function recoverMemoryWaiters(
  instances: Awaited<ReturnType<typeof storage.getAllBotInstances>>, occupied: Set<number>,
  hasRunner: (projectId: number) => boolean,
): Promise<void> {
  const candidates = instances.filter(instance => instance.tokenId != null
    && instance.desiredStatus === 'running' && instance.status !== 'running'
    && !occupied.has(instance.tokenId) && hasRunner(instance.projectId)
    && isMemoryRefusalReason(instance.errorMessage ?? undefined))
    .map(instance => ({ ...instance, tokenId: instance.tokenId! }));
  await queue.tick(candidates, async candidate => {
    if (isServerShuttingDown()) return;
    const token = await storage.getBotToken(candidate.tokenId);
    if (!token?.token || refuseInactiveBotStart(token.isActive, token.authorizationError)
      || !await automaticBotStartAllowed(candidate.projectId, candidate.tokenId)) return;
    // Повторное чтение непосредственно перед запуском отменяет устаревшее ожидание.
    const current = await storage.getBotInstanceByToken(candidate.tokenId);
    if (isServerShuttingDown() || !current || current.desiredStatus !== 'running'
      || current.desiredGeneration !== candidate.desiredGeneration || current.status === 'running'
      || !isMemoryRefusalReason(current.errorMessage ?? undefined)) return;
    // Сценарий не запускается при нехватке памяти: runner заново проверяет cgroup и резерв.
    await startBot(candidate.projectId, token.token, candidate.tokenId,
      { clearLogs: false, reuseGeneratedCode: true, waitForExistingLock: true });
  });
}
