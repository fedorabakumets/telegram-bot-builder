/** @fileoverview Отделяет предупреждения бота от подтверждённого завершения общего обработчика. */

/** Безопасные поля сообщения о завершении процесса, не содержащие пользовательских логов. */
export interface WorkerHostCrashMessage {
  /** Тип служебного сообщения исполнителя. */
  type: string;
  /** Код завершения дочернего процесса или отсутствие кода при сигнале. */
  exit_code?: unknown;
  /** Сигнал завершения дочернего процесса. */
  signal?: unknown;
  /** Счётчики памяти контейнера в момент завершения. */
  diagnostics?: unknown;
}

/**
 * Определяет, можно ли сохранять строку как ошибку, сохраняя совместимость со старым исполнителем.
 * @param content - Очищенный текст строки stderr.
 * @param level - Уровень Python logging, если исполнитель передал его отдельно.
 * @returns Признак ошибки; сами предупреждения остаются в журнале бота.
 */
export function isBotDiagnosticError(content: string, level?: unknown): boolean {
  if (typeof level === 'number' && Number.isFinite(level)) return level >= 40;
  if (typeof level === 'string') {
    const normalized = level.toUpperCase();
    if (['DEBUG', 'INFO', 'WARNING', 'WARN', 'NOTSET'].includes(normalized)) return false;
    if (['ERROR', 'CRITICAL', 'FATAL'].includes(normalized)) return true;
  }
  if (!content.trim()) return false;
  if (/^(?:\[\d{2}:\d{2}:\d{2}\]\s*)?(?:\[?(?:WARNING|WARN|INFO|DEBUG)\]?\b|предупреждение\s*:)/i.test(content)) return false;
  // Старые исполнители не передавали уровень безобидного перехода к стартовому сообщению.
  return !/\[DeepLink\].*(?:fallback|не распознан)/i.test(content);
}

/**
 * Формирует причину только из проверенных полей служебного сообщения, исключая подстановку stderr.
 * @param message - Служебное сообщение от исполнителя.
 * @returns Причина аварии общего обработчика или отсутствие корректного сообщения.
 */
export function parseWorkerHostCrash(message: WorkerHostCrashMessage): string | undefined {
  if (message.type !== 'worker_host_crash') return undefined;
  const code = message.exit_code;
  const signal = message.signal;
  if (code !== null && (!Number.isSafeInteger(code) || Math.abs(Number(code)) > 2_147_483_647)) return undefined;
  if (signal !== null && (typeof signal !== 'string' || !/^SIG[A-Z0-9]{1,16}$/.test(signal))) return undefined;
  const diagnostics = message.diagnostics && typeof message.diagnostics === 'object'
    ? message.diagnostics as Record<string, unknown> : {};
  const memory = ['memoryCurrentBytes', 'memoryMaxBytes', 'oomKillCount', 'oomKillDelta']
    .flatMap(key => Number.isSafeInteger(diagnostics[key]) && Number(diagnostics[key]) >= 0
      ? [`${key}=${diagnostics[key]}`] : []);
  return `[worker_host_crash] Общий обработчик завершился: code=${code}, signal=${signal}${memory.length ? `; ${memory.join(', ')}` : ''}`;
}
