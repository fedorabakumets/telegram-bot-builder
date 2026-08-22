/**
 * @fileoverview Классификация: неожиданный выход бота из WorkerPool (кандидат на autoRestart).
 * @module server/bots/isUnexpectedBotExit
 */

export interface UnexpectedBotExitInput {
  /** ID токена */
  tokenId: number;
  /** Статус из worker / код выхода процесса */
  exitStatus: string | number;
  /** true если Node сам убил воркер (killWorker / shutdownAll) */
  intentionalWorkerKill: boolean;
  /** true если идёт graceful shutdown сервера */
  serverShuttingDown: boolean;
  /** true если stopBot пометил токен как ожидаемый стоп */
  expectedStop: boolean;
}

/**
 * Нужно ли рассматривать выход как неожиданный (OOM, краш, внешний kill).
 *
 * Не рестартим:
 * - shutdown сервера / деплой
 * - кнопку Стоп (expectedStop)
 * - намеренный killWorker
 * - штатный `stopped` / `0` / `running` от Python
 *
 * Рестартим:
 * - `error` от Python
 * - смерть процесса воркера по сигналу (`null`) или ненулевой код
 *
 * @param input - Контекст выхода
 * @returns true если выход неожиданный
 */
export function isUnexpectedBotExit(input: UnexpectedBotExitInput): boolean {
  if (input.serverShuttingDown) return false;
  if (input.expectedStop) return false;
  if (input.intentionalWorkerKill) return false;

  const status = String(input.exitStatus);

  // Штатный stop из Python / clean exit code 0 / legacy CancelledError
  if (status === 'stopped' || status === '0' || status === 'running') {
    return false;
  }

  // Явная ошибка бота
  if (status === 'error') return true;

  // Смерть процесса воркера: signal → code=null; OOM/cgroup тоже SIGKILL
  if (status === 'null') return true;

  // Ненулевой exit code процесса
  const asNum = Number(status);
  if (!Number.isNaN(asNum) && asNum !== 0) return true;

  // Неизвестные статусы — осторожно не рестартим
  return false;
}
