/** @fileoverview Безопасная смена модели подключения и откат по долговременному журналу. */
import type {
  TelegramAccountCutoverExecution,
  TelegramAccountCutoverJournal,
  TelegramAccountCutoverPhase,
  TelegramAccountCutoverPlan,
  TelegramAccountCutoverRuntime,
} from './telegram-account-cutover-types';

/** Тексты ошибок без данных Telegram, параметров подключения и сырых ошибок среды запуска. */
const messages = {
  invalidPlan: 'Некорректный план миграции Telegram-аккаунта',
  invalidPhase: 'Миграцию Telegram-аккаунта нельзя продолжить из сохранённой фазы',
  legacyUnconfirmed: 'Остановка старых клиентов Telegram не подтверждена',
  sharedNotReady: 'Готовность общего клиента Telegram не подтверждена',
  sharedUnconfirmed: 'Отключение общего клиента Telegram не подтверждено',
  legacyNotRestored: 'Восстановление исходных запусков Telegram не подтверждено',
  effectFailed: 'Действие над Telegram-клиентом не подтверждено',
};

/** Ошибка миграции, которую можно безопасно передать вызывающему коду. */
export class TelegramAccountCutoverError extends Error {
  /**
   * Создаёт ошибку с машиночитаемой причиной без чувствительных деталей.
   * @param code - Причина ошибки.
   */
  constructor(readonly code: keyof typeof messages) {
    super(messages[code]);
    this.name = 'TelegramAccountCutoverError';
  }
}

/**
 * Проверяет идентификаторы и приводит список ботов к стабильному порядку.
 * @param plan - Переданный план миграции.
 * @returns План с уникальными упорядоченными идентификаторами.
 */
function normalize(plan: TelegramAccountCutoverPlan): TelegramAccountCutoverPlan {
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647;
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(plan.id) || !validId(plan.projectId)
    || !validId(plan.accountId) || plan.botIds.length === 0 || !plan.botIds.every(validId)) {
    throw new TelegramAccountCutoverError('invalidPlan');
  }
  return { ...plan, botIds: [...new Set(plan.botIds)].sort((left, right) => left - right) };
}

/**
 * Выполняет действие среды запуска без передачи её ошибок клиенту.
 * @param action - Асинхронное действие.
 * @returns Результат действия.
 */
async function effect<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch {
    throw new TelegramAccountCutoverError('effectFailed');
  }
}

/**
 * Переводит старых клиентов на общий аккаунт с возможностью возобновления.
 * @param input - Проверенный прикладным сервисом план миграции.
 * @param journal - Долговременный журнал операций.
 * @param runtime - Среда управления клиентами.
 * @returns Достигнутая фаза.
 */
export async function runTelegramAccountCutover(
  input: TelegramAccountCutoverPlan,
  journal: TelegramAccountCutoverJournal,
  runtime: TelegramAccountCutoverRuntime,
): Promise<TelegramAccountCutoverPhase> {
  const plan = normalize(input);
  return journal.exclusive(plan, 'cutover', async lease => {
    const execution: TelegramAccountCutoverExecution = { plan, fence: lease.fence };
    if (lease.phase === 'prepared') {
      const stopped = new Set(await effect(() => runtime.quiesceLegacy(execution)));
      if (stopped.size !== plan.botIds.length || !plan.botIds.every(id => stopped.has(id))) {
        throw new TelegramAccountCutoverError('legacyUnconfirmed');
      }
      await lease.advance('legacy-stopped');
    }
    if (lease.phase === 'legacy-stopped') {
      await effect(() => runtime.installSharedBindings(execution));
      await lease.advance('shared-installed');
    }
    if (lease.phase === 'shared-installed') {
      if (await effect(() => runtime.startShared(execution)) !== true) {
        throw new TelegramAccountCutoverError('sharedNotReady');
      }
      await lease.advance('shared-ready');
    }
    if (lease.phase !== 'shared-ready') throw new TelegramAccountCutoverError('invalidPhase');
    return 'shared-ready';
  });
}

/**
 * Восстанавливает исходную модель. Старые клиенты запускаются только после подтверждения отключения общего.
 * @param input - Исходный план миграции.
 * @param journal - Долговременный журнал операций.
 * @param runtime - Среда управления клиентами.
 * @returns Достигнутая фаза.
 */
export async function rollbackTelegramAccountCutover(
  input: TelegramAccountCutoverPlan,
  journal: TelegramAccountCutoverJournal,
  runtime: TelegramAccountCutoverRuntime,
): Promise<TelegramAccountCutoverPhase> {
  const plan = normalize(input);
  return journal.exclusive(plan, 'rollback', async lease => {
    const execution: TelegramAccountCutoverExecution = { plan, fence: lease.fence };
    const forwardPhases: TelegramAccountCutoverPhase[] = ['prepared', 'legacy-stopped', 'shared-installed', 'shared-ready'];
    if (forwardPhases.includes(lease.phase)) await lease.advance('rollback-started');
    if (lease.phase === 'rollback-started') {
      if (await effect(() => runtime.quiesceShared(execution)) !== true) {
        throw new TelegramAccountCutoverError('sharedUnconfirmed');
      }
      await lease.advance('shared-stopped');
    }
    if (lease.phase === 'shared-stopped') {
      await effect(() => runtime.restoreLegacyBindings(execution));
      await lease.advance('legacy-restored');
    }
    if (lease.phase === 'legacy-restored') {
      if (await effect(() => runtime.restoreLegacyRuntime(execution)) !== true) {
        throw new TelegramAccountCutoverError('legacyNotRestored');
      }
      await lease.advance('rolled-back');
    }
    if (lease.phase !== 'rolled-back') throw new TelegramAccountCutoverError('invalidPhase');
    return 'rolled-back';
  });
}
