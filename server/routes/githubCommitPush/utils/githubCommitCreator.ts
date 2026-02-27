/**
 * @fileoverview Утилита создания коммита на GitHub
 *
 * Этот модуль предоставляет функцию для создания коммита
 * с изменениями на GitHub через API.
 *
 * @module githubCommitPush/utils/githubCommitCreator
 */

import type { Octokit } from '@octokit/rest';

const OWNER = 'fedorabakumets';
const REPO = 'telegram-bot-builder';

/**
 * Создаёт коммит на GitHub с указанными изменениями
 *
 * @function createGithubCommit
 * @param {Octokit} octokit - Клиент GitHub
 * @param {string} currentRef - SHA текущего коммита
 * @param {Array<{path: string; content: string}>} treeEntries - Записи дерева
 * @param {string} message - Сообщение коммита
 * @returns {Promise<string>} SHA нового коммита
 */
export async function createGithubCommit(
    octokit: Octokit,
    currentRef: string,
    treeEntries: Array<{ path: string; content: string }>,
    message: string
): Promise<string> {
    // Создаём дерево
    const treeResponse = await octokit.git.createTree({
        owner: OWNER,
        repo: REPO,
        tree: treeEntries.map(entry => ({
            path: entry.path,
            mode: '100644' as const,
            type: 'blob' as const,
            content: entry.content
        })),
        base_tree: currentRef
    });

    // Создаём коммит
    const commitResponse = await octokit.git.createCommit({
        owner: OWNER,
        repo: REPO,
        message,
        tree: treeResponse.data.sha,
        parents: [currentRef]
    });

    // Обновляем ссылку
    await octokit.git.updateRef({
        owner: OWNER,
        repo: REPO,
        ref: 'heads/main',
        sha: commitResponse.data.sha
    });

    return commitResponse.data.sha;
}
