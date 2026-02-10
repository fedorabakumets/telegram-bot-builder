/**
 * @fileoverview Модуль для настройки маршрута отправки изменений на GitHub
 *
 * Этот модуль предоставляет функцию для настройки маршрута, который позволяет
 * отправлять изменения в репозиторий GitHub через API, используя персональный
 * токен доступа.
 *
 * @module setupGithubPushRoute
 */

import { Octokit } from '@octokit/rest';
import type { Express } from 'express';
import { execSync } from 'node:child_process';

/**
 * Настраивает маршрут отправки изменений на GitHub
 *
 * @function setupGithubPushRoute
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает маршрут POST /api/push-to-github, который:
 * - Проверяет наличие токена GitHub Personal Access Token
 * - Получает список измененных файлов
 * - Отправляет каждый файл на GitHub через API
 * - Обновляет ветку в удаленном репозитории
 */
export function setupGithubPushRoute(app: Express) {
    /**
     * Обработчик маршрута POST /api/push-to-github
     *
     * Отправляет изменения в репозиторий GitHub через API
     *
     * @route POST /api/push-to-github
     * @param {_req} _req - Объект запроса (не используется)
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Выполняет отправку изменений в репозиторий GitHub, включая:
     * - Проверку наличия токена GitHub Personal Access Token
     * - Получение текущей ветки и хеша коммита
     * - Определение списка измененных файлов
     * - Создание коммитов для каждого файла через GitHub API
     * - Обновление ветки в удаленном репозитории
     */
    app.post("/api/push-to-github", async (_req, res) => {
        try {
            const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
            if (!token) {
                return res.status(400).json({ error: 'GITHUB_PERSONAL_ACCESS_TOKEN not configured' });
            }

            const octokit = new Octokit({ auth: token });

            // Get current branch and commit
            const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
            const currentSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

            // Get list of changed files
            const changedFiles = execSync('git diff --name-only', { encoding: 'utf-8' }).split('\n').filter(f => f.trim());

            if (changedFiles.length === 0) {
                return res.status(400).json({ error: 'No changes to push' });
            }

            console.log(`📤 Pushing ${changedFiles.length} changed files to GitHub...`);

            // Create commits for each file
            let currentSha_ = currentSha;

            for (const file of changedFiles) {
                try {
                    const content = execSync(`git show HEAD:${file}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).toString();

                    // Get file blob
                    const blob = await octokit.git.createBlob({
                        owner: 'fedorabakumets',
                        repo: 'telegram-bot-builder',
                        content: content,
                        encoding: 'utf-8'
                    });

                    // Get current tree
                    const commit = await octokit.git.getCommit({
                        owner: 'fedorabakumets',
                        repo: 'telegram-bot-builder',
                        commit_sha: currentSha_
                    });

                    const { data: currentTree } = await octokit.git.getTree({
                        owner: 'fedorabakumets',
                        repo: 'telegram-bot-builder',
                        tree_sha: commit.data.tree.sha
                    });

                    // Create new tree
                    const tree = await octokit.git.createTree({
                        owner: 'fedorabakumets',
                        repo: 'telegram-bot-builder',
                        tree: [
                            ...(currentTree.tree as any[]).map((item: any) => ({
                                path: item.path,
                                mode: item.mode,
                                type: item.type,
                                sha: item.sha
                            })),
                            {
                                path: file,
                                mode: '100644',
                                type: 'blob',
                                sha: blob.data.sha
                            }
                        ],
                        base_tree: commit.data.tree.sha
                    });

                    // Create commit
                    const newCommit = await octokit.git.createCommit({
                        owner: 'fedorabakumets',
                        repo: 'telegram-bot-builder',
                        message: `Update ${file}`,
                        tree: tree.data.sha,
                        parents: [currentSha_]
                    });

                    currentSha_ = newCommit.data.sha;
                } catch (e) {
                    console.log(`Skipping ${file} (not in HEAD)`);
                }
            }

            // Update main branch
            await octokit.git.updateRef({
                owner: 'fedorabakumets',
                repo: 'telegram-bot-builder',
                ref: `heads/${currentBranch}`,
                sha: currentSha_
            });

            console.log('✅ Successfully pushed to GitHub!');
            return res.json({ success: true, message: 'Successfully pushed to GitHub!', files: changedFiles.length });
        } catch (error: any) {
            console.error('GitHub push error:', error);
            return res.status(500).json({ error: error.message });
        }
    });
}
