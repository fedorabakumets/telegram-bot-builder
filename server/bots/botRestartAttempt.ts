/** @fileoverview Единственная отложенная попытка восстановления токена с проверкой актуального намерения. */
import { storage } from '../storages/storage';
import { startBotAfterStop } from './startBotAfterStop';
import { getBotStartRevision } from './botStartState';
import { automaticBotStartAllowed } from './automaticBotStartAllowed';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import { isServerShuttingDown } from './serverShutdownState';
import { getRestartCounter } from './botRestartManager';
import { resolveStoredBotAutoRestart } from './resolveStoredBotAutoRestart';
import { isMemoryRefusalReason } from './workerMemoryRefusal';

/** Токены, для которых уже запланирована или выполняется попытка. */
const pending = new Set<number>();

/** Условия одной отложенной попытки. */
export interface BotRestartAttempt {
  /** Проект бота. */
  projectId: number;
  /** Запись токена. */
  tokenId: number;
  /** Ревизия ручных действий при планировании. */
  revision: number;
  /** Поколение сохранённого намерения. */
  generation?: number;
  /** Задержка перед попыткой в миллисекундах. */
  delay: number;
  /** Инфраструктурная авария допускает восстановление независимо от автоповторов ошибок бота. */
  infrastructure: boolean;
  /** Следующая ограниченная попытка после неудачного восстановления инфраструктуры. */
  retry(): Promise<void>;
}

/**
 * Проверяет, занята ли очередь восстановления данного токена.
 * @param tokenId - Запись токена.
 * @returns Есть ли запланированная либо выполняемая попытка.
 */
export function hasPendingBotRestart(tokenId: number): boolean { return pending.has(tokenId); }

/**
 * Атомарно резервирует токен перед расходованием общей попытки восстановления.
 * @param tokenId - Запись токена.
 * @returns Получена ли единственная резервация очереди.
 */
export function reserveBotRestart(tokenId: number): boolean {
  if (pending.has(tokenId)) return false;
  pending.add(tokenId);
  return true;
}

/**
 * Планирует выполнение; после ожидания повторно проверяет токен, заморозку и ручную остановку.
 * @param attempt - Условия отложенного запуска текущего поколения.
 * @returns Ничего; завершение и ошибки обрабатываются внутри очереди.
 */
export function queueBotRestart(attempt: BotRestartAttempt): void {
  const { projectId, tokenId, infrastructure } = attempt;
  setTimeout(() => {
    void (async () => {
      let retry = false;
      try {
        if (isServerShuttingDown() || getBotStartRevision(tokenId) !== attempt.revision) return;
        const current = await storage.getBotInstanceByToken(tokenId);
        // Уже поставленная попытка тоже отменяется после отказа вместимости.
        if (isMemoryRefusalReason(current?.errorMessage ?? undefined)) return;
        if (current?.desiredStatus === 'stopped' ||
            (infrastructure && current?.desiredStatus !== 'running') ||
            (attempt.generation !== undefined && current?.desiredGeneration !== attempt.generation)) return;
        if (current?.status === 'running') return;
        const token = await storage.getBotToken(tokenId);
        if (!token?.token ||
            refuseInactiveBotStart(token.isActive, token.authorizationError)) return;
        if (!await automaticBotStartAllowed(projectId, tokenId)) return;
        const latestToken = await storage.getBotToken(tokenId);
        if (!latestToken || latestToken.token !== token.token) return;
        const { autoRestart, maxRestartAttempts } = await resolveStoredBotAutoRestart(projectId, latestToken);
        if ((!infrastructure && !autoRestart) || (getRestartCounter(tokenId)?.attempts ?? 0) > maxRestartAttempts) return;
        const final = await storage.getBotInstanceByToken(tokenId);
        if (isMemoryRefusalReason(final?.errorMessage ?? undefined)) return;
        // Ручное действие во время проверок БД отменяет уже подготовленную попытку.
        if (getBotStartRevision(tokenId) !== attempt.revision || isServerShuttingDown() ||
            final?.desiredStatus === 'stopped' || final?.status === 'running' ||
            refuseInactiveBotStart(latestToken.isActive, latestToken.authorizationError) ||
            (infrastructure && final?.desiredStatus !== 'running') ||
            (attempt.generation !== undefined && final?.desiredGeneration !== attempt.generation)) return;
        const result = await startBotAfterStop(projectId, token.token, tokenId, false);
        if (!result.success) {
          console.error(`[AutoRestart] Не удалось поднять token=${tokenId}: ${result.error}`);
          retry = infrastructure && !isMemoryRefusalReason(result.error);
        }
      } catch (error) {
        console.error(`[AutoRestart] Ошибка рестарта token=${tokenId}:`, error);
        retry = infrastructure && !isMemoryRefusalReason(error instanceof Error ? error.message : undefined);
      } finally { pending.delete(tokenId); }
      if (retry) {
        const current = await storage.getBotInstanceByToken(tokenId);
        if (isMemoryRefusalReason(current?.errorMessage ?? undefined)) return;
        if (getBotStartRevision(tokenId) === attempt.revision && current?.desiredStatus === 'running' &&
            (attempt.generation === undefined || current?.desiredGeneration === attempt.generation)) await attempt.retry();
      }
    })().catch(error => console.error(`[AutoRestart] Ошибка повторного планирования token=${tokenId}:`, error));
  }, attempt.delay);
}
