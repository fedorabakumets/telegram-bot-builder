/**
 * @fileoverview Модуль для настройки маршрута отправки изменений на GitHub
 *
 * Этот модуль предоставляет функцию для настройки маршрута, который позволяет
 * отправлять изменения в репозиторий GitHub через API.
 *
 * @module setupGithubPushRoute
 */

import type { Express } from 'express';
import { createGithubClient } from './githubPush/utils/githubClient';
import { getCurrentBranch, getCurrentSha, getChangedFiles } from './githubPush/utils/gitInfoGetter';
import { pushFileToGithub } from './githubPush/utils/filePusher';
import { updateBranch } from './githubPush/utils/branchUpdater';

/**
 * Настраивает маршрут отправки изменений на GitHub
 *
 * @function setupGithubPushRoute
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupGithubPushRoute(app: Express) {
    app.post("/api/push-to-github", async (_req, res) => {
        try {
            const octokit = createGithubClient();

            const currentBranch = getCurrentBranch();
            const currentSha = getCurrentSha();
            const changedFiles = getChangedFiles();

            if (changedFiles.length === 0) {
                return res.status(400).json({ error: 'Нет изменений для отправки' });
            }

            console.log(`📤 Отправка ${changedFiles.length} файлов на GitHub...`);

            let currentSha_ = currentSha;

            for (const file of changedFiles) {
                try {
                    currentSha_ = await pushFileToGithub(octokit, file, currentSha_);
                } catch (e) {
                    console.log(`Пропуск файла ${file} (отсутствует в HEAD)`);
                }
            }

            await updateBranch(octokit, currentBranch, currentSha_);

            console.log('✅ Успешно отправлено на GitHub!');
            return res.json({
                success: true,
                message: 'Успешно отправлено на GitHub!',
                files: changedFiles.length
            });
        } catch (error: any) {
            console.error('Ошибка отправки на GitHub:', error);
            return res.status(500).json({ error: error.message });
        }
    });
}
