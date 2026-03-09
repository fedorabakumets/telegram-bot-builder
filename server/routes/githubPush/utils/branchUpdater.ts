/**
 * @fileoverview Утилита обновления ветки GitHub
 *
 * Этот модуль предоставляет функцию для обновления ссылки
 * на ветку в удалённом репозитории GitHub.
 *
 * @module githubPush/utils/branchUpdater
 */

import type { Octokit } from '@octokit/rest';

const OWNER = 'fedorabakumets';
const REPO = 'telegram-bot-builder';

/**
 * Обновляет ветку на GitHub
 *
 * @function updateBranch
 * @param {Octokit} octokit - Клиент GitHub
 * @param {string} branch - Имя ветки
 * @param {string} sha - Хеш коммита для установки
 * @returns {Promise<void>}
 */
export async function updateBranch(
    octokit: Octokit,
    branch: string,
    sha: string
): Promise<void> {
    await octokit.git.updateRef({
        owner: OWNER,
        repo: REPO,
        ref: `heads/${branch}`,
        sha
    });
}
