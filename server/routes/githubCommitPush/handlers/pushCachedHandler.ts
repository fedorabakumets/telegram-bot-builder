/**
 * @fileoverview Хендлер отправки закэшированных изменений на GitHub
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на отправку закэшированных изменений в репозиторий GitHub.
 *
 * @module githubCommitPush/handlers/pushCachedHandler
 */

import type { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { createGithubCommit } from '../utils/githubCommitCreator';

/**
 * Обрабатывает запрос на отправку закэшированных изменений
 *
 * @function handlePushCached
 * @param {Request} _req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handlePushCached(_req: Request, res: Response): Promise<void> {
    try {
        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!token) {
            res.status(400).json({ error: 'GitHub token не найден' });
            return;
        }

        // Получаем список изменённых файлов
        const changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
            .split('\n')
            .filter(f => f);

        if (changedFiles.length === 0) {
            res.status(400).json({ error: 'Нет изменений для отправки' });
            return;
        }

        const octokit = new Octokit({ auth: token });

        // Получаем SHA текущего коммита
        const currentRef = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

        // Создаём записи дерева
        const treeEntries = [];
        for (const file of changedFiles) {
            const content = execSync(`git show :${file}`, { encoding: 'utf-8' });
            treeEntries.push({ path: file, content });
        }

        // Создаём коммит
        const commitSha = await createGithubCommit(
            octokit,
            currentRef,
            treeEntries,
            'Реализовать комплексную систему истории действий с отслеживанием в реальном времени'
        );

        console.log('✅ Успешно отправлено в GitHub!');
        res.json({
            success: true,
            message: 'Успешно отправлено в GitHub!',
            commit: commitSha
        });
    } catch (error) {
        console.error('Ошибка отправки в GitHub:', error);
        res.status(500).json({ error: (error as any).message });
    }
}
