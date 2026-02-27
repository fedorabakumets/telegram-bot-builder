/**
 * @fileoverview Утилита проверки существования процесса
 *
 * Этот модуль предоставляет функции для проверки существования
 * процесса по PID в различных операционных системах.
 *
 * @module botManagement/utils/processChecker
 */

/**
 * Проверяет существование процесса по PID
 *
 * @function checkProcessExists
 * @param {string | number} pid - Идентификатор процесса
 * @returns {boolean} true, если процесс существует
 *
 * @description
 * На Windows использует tasklist, на Unix — kill -0
 */
export function checkProcessExists(pid: string | number): boolean {
    try {
        const processId = typeof pid === 'string' ? parseInt(pid) : pid;
        
        if (process.platform === 'win32') {
            const { execSync } = require('child_process');
            const result = execSync(
                `tasklist /FI "PID eq ${processId}" /FO CSV`,
                { encoding: 'utf8' }
            );
            return result.includes(processId.toString());
        } else {
            process.kill(processId, 0);
            return true;
        }
    } catch {
        return false;
    }
}

/**
 * Проверяет, является ли процесс Python-процессом
 *
 * @function isPythonProcess
 * @param {string | number} pid - Идентификатор процесса
 * @returns {boolean} true, если процесс Python
 *
 * @description
 * Проверяет наличие 'python' в выводе ps/tasklist
 */
export function isPythonProcess(pid: string | number): boolean {
    try {
        const processId = typeof pid === 'string' ? parseInt(pid) : pid;
        const { execSync } = require('child_process');
        let output = '';

        if (process.platform === 'win32') {
            output = execSync(
                `tasklist /FI "PID eq ${processId}" /FO CSV`,
                { encoding: 'utf8' }
            ).trim();
        } else {
            output = execSync(
                `ps -p ${processId} -o pid,ppid,cmd --no-headers`,
                { encoding: 'utf8' }
            ).trim();
        }

        return output.toLowerCase().includes('python');
    } catch {
        return false;
    }
}

/**
 * Ищет Python-процесс с указанным файлом бота
 *
 * @function findBotProcessPid
 * @param {number} projectId - Идентификатор проекта
 * @returns {number | null} PID процесса или null
 *
 * @description
 * Ищет процесс Python, который запускает файл бота проекта
 */
export function findBotProcessPid(projectId: number): number | null {
    try {
        const { execSync } = require('child_process');
        const botFileName = `bot_${projectId}.py`;
        const psCommand = process.platform === 'win32'
            ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV`
            : `ps aux | grep python | grep -v grep`;
        
        const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();
        const lines = allPythonProcesses.split('\n');

        for (const line of lines) {
            if (line.includes(botFileName)) {
                const parts = line.trim().split(/\s+/);
                return parseInt(parts[1]);
            }
        }
        return null;
    } catch {
        return null;
    }
}
