/** @fileoverview Определение режима адресата webhook по текущему экземпляру бота. */

import { resolveBotLaunchMode } from '../../shared/bot-launch-mode';
import type { WebhookRecipient } from './telegramWebhookHandler';

/** Чтение полей, необходимых для маршрутизации webhook. */
interface WebhookRecipientStorage {
  /** Читает проект, секрет и индивидуальную конфигурацию. */
  getBotToken: (tokenId: number) => Promise<(WebhookRecipient & {
    /** Должен ли следующий экземпляр использовать настройки проекта. */
    inheritLaunchMode?: boolean | null;
  }) | undefined>;
  /** Читает сохранённый режим работающего или запускаемого экземпляра. */
  getBotInstanceByToken: (tokenId: number) => Promise<{
    /** Текущее состояние экземпляра. */
    status: string;
    /** Режим запущенного экземпляра, null для старых записей. */
    launchMode?: string | null;
  } | undefined>;
  /** Читает способ получения обновлений по умолчанию. */
  getBotProject: (projectId: number) => Promise<{
    /** Настройка проекта для следующего запуска наследующих ботов. */
    defaultLaunchMode?: string | null;
  } | undefined>;
}

/**
 * Сохраняет маршрут работающего бота при редактировании следующего запуска.
 * @param storage - Источник данных адресата и экземпляра.
 * @param tokenId - Идентификатор токена.
 * @returns Режим и секрет для проверки входящего обновления.
 */
export async function getWebhookRecipient(storage: WebhookRecipientStorage, tokenId: number): Promise<WebhookRecipient | undefined> {
  const [token, instance] = await Promise.all([
    storage.getBotToken(tokenId), storage.getBotInstanceByToken(tokenId),
  ]);
  if (!token) return undefined;
  const active = instance?.status === 'running' || instance?.status === 'starting';
  const project = !active && token.inheritLaunchMode ? await storage.getBotProject(token.projectId) : undefined;
  const launchMode = active
    ? instance.launchMode ?? token.launchMode
    : resolveBotLaunchMode(project?.defaultLaunchMode, token.launchMode, token.inheritLaunchMode);
  return { projectId: token.projectId, launchMode, webhookSecretToken: token.webhookSecretToken };
}
