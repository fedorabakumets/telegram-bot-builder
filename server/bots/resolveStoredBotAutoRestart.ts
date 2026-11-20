/** @fileoverview Чтение актуального автоперезапуска с учётом настроек проекта. */

import { resolveBotAutoRestart } from '../../shared/bot-execution-settings';
import { storage } from '../storages/storage';

/**
 * Читает настройки проекта только при наследовании хотя бы одного поля.
 * @param projectId - Идентификатор проекта.
 * @param token - Индивидуальные поля и признаки наследования.
 * @returns Действующие настройки автоперезапуска.
 */
export async function resolveStoredBotAutoRestart(
  projectId: number, token: Parameters<typeof resolveBotAutoRestart>[1],
) {
  const project = token.inheritAutoRestart || token.inheritMaxRestartAttempts
    ? await storage.getBotProject(projectId) : undefined;
  return resolveBotAutoRestart(project, token);
}
