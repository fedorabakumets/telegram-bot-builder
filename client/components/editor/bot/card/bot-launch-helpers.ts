/**
 * @fileoverview Вспомогательные функции для блока настроек режима запуска бота
 * @module components/editor/bot/card/bot-launch-helpers
 */

import { resolveBotLaunchMode, type BotLaunchMode } from '@shared/bot-launch-mode';

/** Режим запуска, используемый формами настроек ботов и проекта. */
export type LaunchMode = BotLaunchMode;

/** Выбор источника режима в настройках бота. */
export type LaunchModeChoice = LaunchMode | 'inherit';

/**
 * Возвращает режим, который будет использован при следующем запуске.
 * @param choice - Сохранённый или черновой выбор бота.
 * @param projectMode - Режим проекта по умолчанию.
 * @returns Режим бота с учётом наследования.
 */
export function effectiveLaunchMode(choice: string | null, projectMode?: string | null): BotLaunchMode {
  return resolveBotLaunchMode(projectMode, choice, choice === 'inherit');
}

/** Свойства блока выбора режима запуска */
export interface BotLaunchSettingsProps {
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Текущий режим запуска из БД */
  launchMode: string | null;
  /** Режим проекта, используемый при наследовании. */
  projectLaunchMode?: string | null;
  /** Базовый URL для webhook из БД */
  webhookBaseUrl: string | null;
  /** Базовый адрес, заданный в настройках проекта. */
  projectWebhookBaseUrl?: string | null;
  /** Блокирует редактирование адреса во время сохранения или без прав. */
  addressDisabled?: boolean;
  /** Секретный токен webhook из БД */
  webhookSecretToken: string | null;
  /** Сервер подтвердил наличие сохранённого секрета без раскрытия значения. */
  hasWebhookSecret?: boolean;
  /** Дополнительный CSS-класс */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление настроек режима запуска
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param changes - Только изменённые поля.
 */
export async function updateLaunchSettings(
  projectId: number,
  tokenId: number,
  changes: LaunchSettingsPatch,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/launch-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error('Ошибка обновления настроек запуска');
}

/** Частичное изменение режима запуска и параметров webhook. */
export interface LaunchSettingsPatch {
  /** Новый выбор способа получения обновлений. */
  launchMode?: LaunchModeChoice;
  /** Свой адрес, пустое значение или признак наследования. */
  webhookBaseUrl?: string | null;
  /** Новый секрет webhook. */
  webhookSecretToken?: string | null;
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
