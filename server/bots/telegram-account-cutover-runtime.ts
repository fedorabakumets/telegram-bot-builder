/** @fileoverview Реальная среда переноса Telegram с подтверждениями воркера и брокера. */
import {
  installProjectTelegramAccountCutoverBindings, restoreProjectTelegramAccountCutoverBindings,
} from '../database/project-telegram-account-cutover-bindings';
import { getProjectTelegramAccount, getProjectTelegramAccountSecrets } from '../database/project-telegram-accounts-store';
import { confirmProjectTelegramAccountSession } from '../database/project-telegram-account-credential-store';
import { loadTelegramCutoverRuntimeState } from '../database/project-telegram-account-cutover-runtime-state';
import { resolveBotRuntimeMode } from '../runtime/bot-runtime-mode';
import { botProcesses } from '../routes/routes';
import { storage } from '../storages/storage';
import { workerManager } from './botWorkerManager';
import { callProjectTelegramBroker } from './project-telegram-broker-client';
import { startBot } from './startBot';
import { stopBot } from './stopBot';
import {
  isTelegramAccountCutoverAvailable, telegramCutoverConfigurationReason, type TelegramCutoverAvailabilityReason,
} from './telegram-account-cutover-availability';
import { sendAuthCommand } from './userbotAuthManager';
import { fenceQueuedTelegramCutoverStarts } from './telegram-cutover-command-fence';
import type { TelegramAccountCutoverExecution, TelegramAccountCutoverRuntime } from './telegram-account-cutover-types';
import { getWorkerRuntime } from './workerRuntime';

export { isTelegramAccountCutoverAvailable } from './telegram-account-cutover-availability';

/**
 * Проверяет офлайн-доказательство от своего дочернего процесса.
 * @param projectId - Проект в локальном режиме.
 * @returns Подтверждён ли выход последнего процесса.
 */
function hasOfflineCutoverProof(projectId: number): boolean {
  return resolveBotRuntimeMode() === 'combined' && getWorkerRuntime() === 'process'
    && workerManager.hasTelegramCutoverWorkerExitProof(projectId);
}

/**
 * Объясняет доступность начала переноса для владельца проекта.
 * @param projectId - Проект для миграции.
 * @returns Причина недоступности или отсутствие ограничений.
 */
export function telegramCutoverAvailabilityReason(projectId: number): TelegramCutoverAvailabilityReason | null {
  return telegramCutoverConfigurationReason()
    ?? (workerManager.hasWorker(projectId) || hasOfflineCutoverProof(projectId) ? null : 'worker-unavailable');
}

/**
 * Проверяет возможность первого переноса, прежде чем зарезервировать карточку.
 * @param projectId - Проект с известным воркером.
 * @param botIds - Боты выбранной группы для проверки остальных запусков воркера.
 * @returns Доступна ли подтверждённая остановка сейчас.
 */
export function canStartTelegramAccountCutover(projectId: number, botIds?: readonly number[]): boolean {
  return isTelegramAccountCutoverAvailable()
    && !botIds?.some(id => botProcesses.has(`${projectId}_${id}`))
    && (hasOfflineCutoverProof(projectId)
    || (workerManager.hasWorker(projectId) && (!botIds || workerManager.canRetireWorkerForTelegramCutover(projectId, botIds))));
}

/**
 * Останавливает каждый бот только после ответа известного воркера.
 * @param projectId - Проект переноса.
 * @param botIds - Полный список ботов.
 * @param retireWorker - Будет ли выход целого воркера проверен вызывающей стороной.
 * @returns Идентификаторы подтверждённых остановок.
 */
async function stopBots(projectId: number, botIds: readonly number[], retireWorker = false): Promise<number[]> {
  const stopped: number[] = [];
  for (const botId of botIds) {
    if (!isTelegramAccountCutoverAvailable() || !workerManager.hasWorker(projectId)) break;
    if (resolveBotRuntimeMode() === 'api') {
      const instance = await storage.getBotInstanceByToken(botId);
      if (!instance?.desiredStatus) {
        if (!retireWorker || workerManager.isBotRunning(projectId, botId)) break;
        /** Для незапускавшегося бота дальше требуется общий ответ исполнителя о завершении воркера. */
        stopped.push(botId);
        continue;
      }
    }
    if (!(await stopBot(projectId, botId, { requireWorkerConfirmation: true })).success) break;
    stopped.push(botId);
  }
  return stopped;
}

/**
 * Закрывает процессы незавершённого входа, которые могли сохранить старое подключение.
 * @param botIds - Боты выбранной группы.
 * @returns Подтвердили ли процессы завершение старых подключений.
 */
async function disconnectLegacyAuth(botIds: readonly number[]): Promise<boolean> {
  for (const id of botIds) {
    const auth = await sendAuthCommand(id, 'disconnect');
    if (auth?.ok !== true) return false;
  }
  return true;
}

/**
 * Запускает только ранее активных ботов через авторизацию текущей фазы.
 * @param execution - План и маркер захвата.
 * @param botIds - Боты из сохранённого снимка.
 * @returns Подтверждение готовности всех запусков.
 */
async function restartBots({ plan, fence }: TelegramAccountCutoverExecution, botIds: readonly number[]): Promise<boolean> {
  for (const botId of botIds) {
    if (!plan.botIds.includes(botId) || !isTelegramAccountCutoverAvailable()) return false;
    /** Ручная остановка, сделанная после снимка, отменяет восстановление запуска. */
    const instance = await storage.getBotInstanceByToken(botId);
    if (instance?.desiredStatus === 'stopped') continue;
    if (workerManager.isBotRunning(plan.projectId, botId)) continue;
    const token = await storage.getBotToken(botId);
    if (!token?.token || token.projectId !== plan.projectId) return false;
    const started = await startBot(plan.projectId, token.token, botId, {
      clearLogs: false, telegramCutover: { id: plan.id, fence },
    });
    if (!started.success || !workerManager.isBotRunning(plan.projectId, botId)) return false;
  }
  return true;
}

/** Использует только подтверждённые остановки воркера и состояние подключения брокера. */
export const telegramAccountCutoverRuntime: TelegramAccountCutoverRuntime = {
  async quiesceLegacy(execution) {
    const { projectId, botIds } = execution.plan;
    const state = await loadTelegramCutoverRuntimeState(execution, 'prepared');
    if (state.legacyWorkerExited === true) return botIds;
    if (!canStartTelegramAccountCutover(projectId, botIds)) return [];
    const running = botIds.filter(id => workerManager.isBotRunning(projectId, id));
    await loadTelegramCutoverRuntimeState(execution, 'prepared', { key: 'legacyIntent', value: running });
    const exited = hasOfflineCutoverProof(projectId)
      ? await workerManager.withOfflineTelegramCutover(projectId, () => disconnectLegacyAuth(botIds))
      : await workerManager.retireWorkerForTelegramCutover(projectId, botIds, async () =>
        await fenceQueuedTelegramCutoverStarts(projectId, botIds) && await disconnectLegacyAuth(botIds)
          && (await stopBots(projectId, botIds, true)).length === botIds.length);
    if (!exited) return [];
    await loadTelegramCutoverRuntimeState(execution, 'prepared', { key: 'legacyWorkerExited', value: true });
    return botIds;
  },
  installSharedBindings: installProjectTelegramAccountCutoverBindings,
  async startShared(execution) {
    const { projectId, accountId } = execution.plan;
    const state = await loadTelegramCutoverRuntimeState(execution, 'shared-installed');
    if (!state.legacyIntent || !state.bindingInstall || !isTelegramAccountCutoverAvailable()) return false;
    const secrets = await getProjectTelegramAccountSecrets(projectId, accountId);
    if (!secrets?.session) return false;
    const result = await callProjectTelegramBroker('verify', {
      accountId, apiId: Number(secrets.session.apiId), apiHash: secrets.session.apiHash,
      sessionString: secrets.session.sessionString, proxy: secrets.proxy,
    });
    if (!result || typeof result !== 'object' || !('authorized' in result) || result.authorized !== true) return false;
    /** Собирает имя и фамилию из подтверждённого профиля. */
    const telegramName = [
      'firstName' in result && typeof result.firstName === 'string' ? result.firstName : '',
      'lastName' in result && typeof result.lastName === 'string' ? result.lastName : '',
    ].filter(Boolean).join(' ');
    const confirmed = await confirmProjectTelegramAccountSession(projectId, accountId, secrets.session.sessionString, {
      telegramUserId: 'id' in result && typeof result.id === 'string' ? result.id : undefined,
      telegramName: telegramName || undefined,
      telegramUsername: 'username' in result && typeof result.username === 'string' ? result.username : undefined,
    });
    if (!confirmed) return false;
    if (state.legacyIntent.length) {
      await loadTelegramCutoverRuntimeState(execution, 'shared-installed', { key: 'sharedStartAttempted', value: true });
    }
    return restartBots(execution, state.legacyIntent);
  },
  async quiesceShared(execution) {
    const { projectId, accountId, botIds } = execution.plan;
    const state = await loadTelegramCutoverRuntimeState(execution, 'rollback-started');
    if (!state.bindingInstall) return true;
    const account = await getProjectTelegramAccount(projectId, accountId);
    if (!account || account.botIds.some(id => !botIds.includes(id))
      || botIds.some(id => botProcesses.has(`${projectId}_${id}`))) return false;
    if (state.sharedStartAttempted && !hasOfflineCutoverProof(projectId)
      && (!await fenceQueuedTelegramCutoverStarts(projectId, botIds)
        || (await stopBots(projectId, botIds)).length !== botIds.length)) return false;
    const result = await callProjectTelegramBroker('disconnect', { accountId, block: true });
    return !!result && typeof result === 'object' && 'disconnected' in result && result.disconnected === true;
  },
  restoreLegacyBindings: restoreProjectTelegramAccountCutoverBindings,
  async restoreLegacyRuntime(execution) {
    const { legacyIntent, legacyWorkerExited } = await loadTelegramCutoverRuntimeState(execution, 'legacy-restored');
    const candidates: number[] = [];
    for (const id of legacyIntent ?? []) {
      const instance = await storage.getBotInstanceByToken(id);
      if (instance?.desiredStatus !== 'stopped') candidates.push(id);
    }
    /** Без подтверждённого выхода не создаём новый клиент со старым ключом. */
    if (legacyWorkerExited !== true) {
      return candidates.every(id => workerManager.isBotRunning(execution.plan.projectId, id));
    }
    /** Два старых клиента не могут безопасно разделить один и тот же ключ. */
    if (candidates.length > 1) return false;
    return restartBots(execution, candidates);
  },
};
