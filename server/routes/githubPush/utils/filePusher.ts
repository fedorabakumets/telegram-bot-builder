/**
 * @fileoverview Утилита отправки файла на GitHub
 *
 * Этот модуль предоставляет функцию для создания blob и коммита
 * файла на GitHub через API.
 *
 * @module githubPush/utils/filePusher
 */

import type { Octokit } from '@octokit/rest';
import { getFileContentFromHead } from './gitInfoGetter';

const OWNER = 'fedorabakumets';
const REPO = 'telegram-bot-builder';

/**
 * Отправляет файл на GitHub
 *
 * @function pushFileToGithub
 * @param {Octokit} octokit - Клиент GitHub
 * @param {string} filePath - Путь к файлу
 * @param {string} currentSha - Текущий хеш коммита
 * @returns {Promise<string>} Новый хеш коммита
 */
export async function pushFileToGithub(
    octokit: Octokit,
    filePath: string,
    currentSha: string
): Promise<string> {
    const content = getFileContentFromHead(filePath);

    // Создаём blob
    const blob = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content,
        encoding: 'utf-8'
    });

    // Получаем текущий коммит
    const commit = await octokit.git.getCommit({
        owner: OWNER,
        repo: REPO,
        commit_sha: currentSha
    });

    // Получаем текущее дерево
    const { data: currentTree } = await octokit.git.getTree({
        owner: OWNER,
        repo: REPO,
        tree_sha: commit.data.tree.sha
    });

    // Создаём новое дерево
    const tree = await octokit.git.createTree({
        owner: OWNER,
        repo: REPO,
        tree: [
            ...(currentTree.tree as any[]).map((item: any) => ({
                path: item.path,
                mode: item.mode,
                type: item.type,
                sha: item.sha
            })),
            {
                path: filePath,
                mode: '100644',
                type: 'blob',
                sha: blob.data.sha
            }
        ],
        base_tree: commit.data.tree.sha
    });

    // Создаём коммит
    const newCommit = await octokit.git.createCommit({
        owner: OWNER,
        repo: REPO,
        message: `Update ${filePath}`,
        tree: tree.data.sha,
        parents: [currentSha]
    });

    return newCommit.data.sha;
}
