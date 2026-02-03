/**
 * @fileoverview Маршруты для интеграции с GitHub
 *
 * Этот файл содержит маршруты для взаимодействия с GitHub API,
 * включая возможность отправки изменений в репозиторий.
 */

import express from 'express';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

/**
 * Маршрутизатор для GitHub интеграции
 */
export const githubRouter = express.Router();

/**
 * Маршрут для отправки изменений в GitHub репозиторий
 *
 * Этот маршрут позволяет программно отправить закэшированные изменения
 * в GitHub репозиторий с использованием GitHub Personal Access Token.
 *
 * @route POST /push-to-github
 * @param _req - Объект запроса (не используется в данном маршруте)
 * @param res - Объект ответа
 * @returns JSON-ответ с информацией о результате операции
 */
githubRouter.post('/push-to-github', async (_req, res) => {
  try {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: 'GitHub token not found' });
    }

    // Получить git diff
    const diff = execSync('git diff --cached', { encoding: 'utf-8' });
    const changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).split('\n').filter(f => f);

    if (changedFiles.length === 0) {
      return res.status(400).json({ error: 'No changes to push' });
    }

    const octokit = new Octokit({ auth: token });

    // Получить SHA текущего коммита
    const currentRef = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

    // Создать записи дерева
    const treeEntries = [];
    for (const file of changedFiles) {
      const content = execSync(`git show :${file}`, { encoding: 'utf-8' });
      treeEntries.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content
      });
    }

    // Создать дерево
    const treeResponse = await octokit.git.createTree({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      tree: treeEntries as any,
      base_tree: currentRef
    });

    // Создать коммит
    const commitResponse = await octokit.git.createCommit({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      message: 'Implement comprehensive action history system with real-time tracking',
      tree: treeResponse.data.sha,
      parents: [currentRef]
    });

    // Обновить ссылку
    await octokit.git.updateRef({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      ref: 'heads/main',
      sha: commitResponse.data.sha
    });

    res.json({
      success: true,
      message: 'Successfully pushed to GitHub!',
      commit: commitResponse.data.sha
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: (error as any).message });
  }
});
