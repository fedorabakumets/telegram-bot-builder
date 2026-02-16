import { ChildProcess } from "node:child_process";
import { botProcesses } from "../routes/routes";

/**
 * Поиск активного дочернего процесса для указанного проекта.
 *
 * @param projectId - Уникальный идентификатор проекта, для которого нужно найти активный процесс
 * @returns Объект, содержащий ключ процесса и сам объект дочернего процесса, или null если активный процесс не найден
 *
 * @description
 * Эта функция перебирает все сохраненные процессы ботов в глобальной коллекции botProcesses,
 * ищет процесс, который:
 * 1. Принадлежит указанному проекту (ключ начинается с `${projectId}_`)
 * 2. Процесс существует (не null или undefined)
 * 3. Процесс не убит (свойство killed равно false)
 * 4. Процесс все еще запущен (exitCode равно null)
 *
 * @example
 * ```typescript
 * const activeProcess = findActiveProcessForProject(123);
 * if (activeProcess) {
 *   console.log(`Найден активный процесс: ${activeProcess.processKey}`);
 *   // Можно выполнить действия с процессом
 * } else {
 *   console.log('Активный процесс для проекта не найден');
 * }
 * ```
 */
export function findActiveProcessForProject(projectId: number): { processKey: string; process: ChildProcess; } | null {
  for (const [key, process] of Array.from(botProcesses.entries())) {
    if (key.startsWith(`${projectId}_`) && process && !process.killed && process.exitCode === null) {
      return { processKey: key, process };
    }
  }
  return null;
}
