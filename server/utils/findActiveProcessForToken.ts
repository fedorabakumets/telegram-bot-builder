/**
 * @fileoverview Поиск активного процесса бота по токену
 *
 * Этот модуль предоставляет функцию для поиска активного процесса
 * для конкретного токена бота.
 *
 * @module utils/findActiveProcessForToken
 */

import { ChildProcess } from "node:child_process";
import { botProcesses } from "../routes/routes";

/**
 * Поиск активного дочернего процесса для указанного токена
 *
 * @param projectId - Уникальный идентификатор проекта
 * @param tokenId - Уникальный идентификатор токена
 * @returns Объект, содержащий ключ процесса и сам объект дочернего процесса, или null если активный процесс не найден
 *
 * @description
 * Эта функция ищет процесс в глобальной коллекции botProcesses по ключу в формате
 * `${projectId}_${tokenId}` и проверяет, что процесс активен.
 *
 * @example
 * ```typescript
 * const activeProcess = findActiveProcessForToken(123, 456);
 * if (activeProcess) {
 *   console.log(`Найден активный процесс: ${activeProcess.processKey}`);
 * } else {
 *   console.log('Активный процесс для токена не найден');
 * }
 * ```
 */
export function findActiveProcessForToken(projectId: number, tokenId: number): { processKey: string; process: ChildProcess; } | null {
  const processKey = `${projectId}_${tokenId}`;
  const process = botProcesses.get(processKey);
  
  if (process && !process.killed && process.exitCode === null) {
    return { processKey, process };
  }
  
  return null;
}
