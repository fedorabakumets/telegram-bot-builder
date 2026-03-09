/**
 * @fileoverview Утилита создания GitHub клиента
 *
 * Этот модуль предоставляет функцию для создания и настройки
 * клиента Octokit для работы с GitHub API.
 *
 * @module githubPush/utils/githubClient
 */

import { Octokit } from '@octokit/rest';

/**
 * Создаёт и настраивает клиент GitHub
 *
 * @function createGithubClient
 * @returns {Octokit} Настроенный клиент Octokit
 * @throws {Error} Если токен не настроен
 */
export function createGithubClient(): Octokit {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (!token) {
        throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN не настроен');
    }

    return new Octokit({ auth: token });
}
