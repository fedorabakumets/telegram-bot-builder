/**
 * @fileoverview Вспомогательные функции для блока настроек режима запуска бота
 * @module components/editor/bot/card/bot-launch-helpers
 */

/** Режим запуска бота */
export type LaunchMode = 'polling' | 'webhook';

/** Свойства блока выбора режима запуска */
export interface BotLaunchSettingsProps {
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Текущий режим запуска из БД */
  launchMode: string | null;
  /** Базовый URL для webhook из БД */
  webhookBaseUrl: string | null;
  /** Секретный токен webhook из БД */
  webhookSecretToken: string | null;
  /** Дополнительный CSS-класс */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление настроек режима запуска
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param launchMode - Режим запуска
 * @param webhookBaseUrl - Базовый URL webhook
 * @param webhookSecretToken - Секретный токен webhook
 */
export async function updateLaunchSettings(
  projectId: number,
  tokenId: number,
  launchMode: string,
  webhookBaseUrl: string | null,
  webhookSecretToken: string | null,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/launch-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ launchMode, webhookBaseUrl, webhookSecretToken }),
  });
  if (!res.ok) throw new Error('Ошибка обновления настроек запуска');
}

/**
 * Формирует предпросмотр полного webhook URL
 * @param baseUrl - Базовый адрес сервера
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Составленный URL
 */
export function buildWebhookPreview(baseUrl: string, projectId: number, tokenId: number): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (!normalized) return `/api/webhook/${projectId}/${tokenId}`;
  return `${normalized}/api/webhook/${projectId}/${tokenId}`;
}
