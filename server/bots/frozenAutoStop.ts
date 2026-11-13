/** @fileoverview Отложенная остановка подтверждённо замороженного запуска без блокировки журналов. */
import { getActiveLaunchId as activeLaunch } from '../terminal/activeLaunchIds';

/** Контекст запуска, которому Telegram подтвердил ограничение. */
export interface FrozenStopRequest {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор слота бота. */
  tokenId: number;
  /** Подтверждённая запись текущего запуска. */
  launchId: number;
  /** Наблюдавшийся секрет для защиты замены токена; никогда не журналируется. */
  expectedToken?: string;
  /** Зафиксированная версия намерения остановки для отложенной команды. */
  expectedDesiredGeneration?: number;
}
/** Зависимости проверки и штатной остановки, подменяемые в адресном тесте. */
export interface FrozenStopDependencies {
  /** Текущий запуск слота. */
  currentLaunch: (tokenId: number) => number | undefined;
  /** Проверяет владение и фиксирует остановку с защитой версии намерения. */
  persistStop: (request: FrozenStopRequest) => Promise<number | false>;
  /** Штатно завершает только подтверждённый запуск. */
  stop: (request: FrozenStopRequest) => Promise<void>;
  /** Планирует задачу после возврата из обработчика лога. */
  defer: (task: () => void) => void;
  /** Сообщает об ошибке без содержимого токенов. */
  report: () => void;
}

/** Создаёт идемпотентный планировщик, который никогда не ожидается внутри доставки логов. */
export function createFrozenAutoStop(deps: FrozenStopDependencies) {
  const pending = new Set<string>();
  return (request: FrozenStopRequest): void => {
    if (deps.currentLaunch(request.tokenId) !== request.launchId) return;
    const key = `${request.projectId}:${request.tokenId}:${request.launchId}`;
    if (pending.has(key)) return;
    pending.add(key);
    deps.defer(() => {
      void (async () => {
        if (deps.currentLaunch(request.tokenId) !== request.launchId) return;
        const generation = await deps.persistStop(request);
        if (generation === false) return;
        if (deps.currentLaunch(request.tokenId) !== request.launchId) return;
        await deps.stop({ ...request, expectedDesiredGeneration: generation });
      })().catch(deps.report).finally(() => pending.delete(key));
    });
  };
}

/** Создаёт барьер сохранения намерения: завершение не ждёт ответа исполнителя на stop. */
export function createFrozenStopConfirmation(deps: FrozenStopDependencies) {
  const pending = new Map<string, Promise<boolean>>();
  return (request: FrozenStopRequest): Promise<boolean> => {
    const key = `${request.projectId}:${request.tokenId}:${request.launchId}`;
    if (deps.currentLaunch(request.tokenId) !== request.launchId) return Promise.resolve(false);
    const existing = pending.get(key);
    if (existing) return existing;
    const task = (async () => {
      const generation = await deps.persistStop(request);
      if (generation === false || deps.currentLaunch(request.tokenId) !== request.launchId) {
        pending.delete(key);
        return false;
      }
      deps.defer(() => {
        if (deps.currentLaunch(request.tokenId) !== request.launchId) { pending.delete(key); return; }
        void deps.stop({ ...request, expectedDesiredGeneration: generation })
          .catch(deps.report).finally(() => pending.delete(key));
      });
      return true;
    })();
    pending.set(key, task);
    void task.catch(() => pending.delete(key));
    return task;
  };
}

/** Общие зависимости лениво загружают БД и остановку, исключая цикл импортов. */
const productionDependencies: FrozenStopDependencies = {
  currentLaunch: activeLaunch,
  defer: (task) => { setImmediate(task); },
  report: () => console.error('[frozenBot] Не удалось подтвердить остановку ограниченного бота'),
  persistStop: async (context) => {
    const [{ storage }, { setBotDesiredStatus }] = await Promise.all([
      import('../storages/storage'), import('./setBotDesiredStatus'),
    ]);
    const token = await storage.getBotToken(context.tokenId);
    const instance = await storage.getBotInstanceByToken(context.tokenId);
    if (!token || token.projectId !== context.projectId || !instance
      || (context.expectedToken !== undefined && token.token !== context.expectedToken)
      || activeLaunch(context.tokenId) !== context.launchId) return false;
    return (await setBotDesiredStatus(instance.id, 'stopped', instance.desiredGeneration)) ?? false;
  },
  stop: async (context) => {
    const { stopBot } = await import('./stopBot');
    const result = await stopBot(context.projectId, context.tokenId, { expectedLaunchId: context.launchId, expectedDesiredGeneration: context.expectedDesiredGeneration });
    if (!result.success) throw new Error('Остановка ограниченного запуска не подтверждена');
  },
};
/** Планировщик для источников, которым не требуется ожидание записи намерения. */

/** Барьер перед обработкой выхода процесса: ждёт только запись намерения, не stop. */
export const confirmFrozenBotStop = createFrozenStopConfirmation(productionDependencies);
/** Планирует штатную остановку подтверждённого текущего запуска. */
export function scheduleFrozenBotStop(request: FrozenStopRequest): void { void confirmFrozenBotStop(request).catch(productionDependencies.report); }
