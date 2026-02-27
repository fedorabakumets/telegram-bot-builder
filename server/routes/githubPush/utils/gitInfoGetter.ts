/**
 * @fileoverview Утилита получения информации из git
 *
 * Этот модуль предоставляет функции для получения информации
 * о текущем состоянии git репозитория.
 *
 * @module githubPush/utils/gitInfoGetter
 */

import { execSync } from 'node:child_process';

/**
 * Получает имя текущей ветки
 *
 * @function getCurrentBranch
 * @returns {string} Имя текущей ветки
 */
export function getCurrentBranch(): string {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

/**
 * Получает хеш текущего коммита
 *
 * @function getCurrentSha
 * @returns {string} Хеш текущего коммита
 */
export function getCurrentSha(): string {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
}

/**
 * Получает список изменённых файлов
 *
 * @function getChangedFiles
 * @returns {string[]} Массив имён изменённых файлов
 */
export function getChangedFiles(): string[] {
    return execSync('git diff --name-only', { encoding: 'utf-8' })
        .split('\n')
        .filter(f => f.trim());
}

/**
 * Получает содержимое файла из HEAD
 *
 * @function getFileContentFromHead
 * @param {string} filePath - Путь к файлу
 * @returns {string} Содержимое файла
 */
export function getFileContentFromHead(filePath: string): string {
    return execSync(`git show HEAD:${filePath}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
    }).toString();
}
