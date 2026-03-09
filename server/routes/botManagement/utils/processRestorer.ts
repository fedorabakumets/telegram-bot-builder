/**
 * @fileoverview Утилита восстановления отслеживания процессов
 *
 * Этот модуль предоставляет функции для восстановления отслеживания
 * процессов бота в памяти приложения.
 *
 * @module botManagement/utils/processRestorer
 */

import { botProcesses } from '../../routes';

/**
 * Создаёт фиктивный объект процесса для отслеживания
 *
 * @function createMockProcess
 * @param {number} pid - Идентификатор процесса
 * @returns {Object} Объект с методами процесса
 *
 * @description
 * Создаёт объект с методом kill для управления процессом
 */
export function createMockProcess(pid: number) {
    return {
        pid,
        killed: false,
        exitCode: null,
        kill: (signal: any) => {
            try {
                process.kill(pid, signal);
                return true;
            } catch {
                return false;
            }
        }
    } as any;
}

/**
 * Восстанавливает отслеживание процесса в памяти
 *
 * @function restoreProcessTracking
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 * @param {number} pid - Идентификатор процесса
 * @returns {void}
 *
 * @description
 * Добавляет процесс в botProcesses для возможности остановки
 */
export function restoreProcessTracking(
    projectId: number,
    tokenId: number,
    pid: number
): void {
    const processKey = `${projectId}_${tokenId}`;
    botProcesses.set(processKey, createMockProcess(pid));
}
