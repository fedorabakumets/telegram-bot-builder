/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Переключатель автоперезапуска
 * - Таймер выполнения (только когда бот запущен)
 * - Список администраторов
 * - История запусков
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotAutoRestartToggle } from './BotAutoRestartToggle';
import { BotExecutionTimer } from './BotExecutionTimer';
import { BotLogLevelSelect } from './BotLogLevelSelect';
import { BotAdminIds } from '../profile/BotAdminIds';
import { ProjectCollaborators } from '../profile/ProjectCollaborators';
import { BotLaunchHistory } from './BotLaunchHistory';
import { BotLaunchSettings } from './BotLaunchSettings';
import type { BotStatusResponse } from '../bot-types';
import type { BotToken } from '@shared/schema';

/** Пропсы сетки настроек бота */
interface BotSettingsGridProps {
  /** ID проекта */
  projectId: number;
  /** Имеет ли текущий пользователь права управления (владелец или коллаборатор) */
  canManage: boolean;
  /** ID токена */
  tokenId: number;
  /** Имя бота (для передачи в историю запусков) */
  botName?: string;
  /** Включена ли база данных пользователей (1 — да, 0/null — нет) */
  userDatabaseEnabled: number | null;
  /** Запущен ли бот */
  isBotRunning: boolean;
  /** Текущее время работы ботов в секундах (ключ — tokenId) */
  currentElapsedSeconds: Record<number, number>;
  /** Статусы всех ботов */
  allBotStatuses: BotStatusResponse[];
  /** Данные токена для настроек автоперезапуска */
  token: Pick<BotToken, 'id' | 'autoRestart' | 'maxRestartAttempts' | 'logLevel'>;
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: {
    /** Флаг ожидания ответа */
    isPending: boolean;
    /** Функция мутации */
    mutate: (enabled: boolean) => void;
  };
  /** Режим запуска бота */
  launchMode: string | null;
  /** Базовый URL для webhook */
  webhookBaseUrl: string | null;
  /** Секретный токен webhook */
  webhookSecretToken: string | null;
}

/**
 * Сетка настроек бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotSettingsGrid({
  projectId,
  tokenId,
  botName,
  userDatabaseEnabled,
  isBotRunning,
  currentElapsedSeconds,
  allBotStatuses,
  token,
  toggleDatabaseMutation,
  launchMode,
  webhookBaseUrl,
  webhookSecretToken,
  canManage,
}: BotSettingsGridProps) {
  const resolvedBotName = botName ?? `Бот ${tokenId}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <BotLaunchSettings
        tokenId={tokenId}
        projectId={projectId}
        launchMode={launchMode}
        webhookBaseUrl={webhookBaseUrl}
        webhookSecretToken={webhookSecretToken}
        className="sm:col-span-2"
      />
      <BotDatabaseToggle
        projectId={projectId}
        tokenId={tokenId}
        userDatabaseEnabled={userDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
      />
      <BotAutoRestartToggle
        projectId={projectId}
        tokenId={tokenId}
        autoRestart={token.autoRestart}
        maxRestartAttempts={token.maxRestartAttempts}
      />
      <BotLogLevelSelect
        projectId={projectId}
        tokenId={tokenId}
        logLevel={token.logLevel ?? 'WARNING'}
      />
      {isBotRunning && (
        <BotExecutionTimer
          tokenId={tokenId}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
        />
      )}
      <BotAdminIds projectId={projectId} />
      <ProjectCollaborators projectId={projectId} canManage={canManage} />
      <BotLaunchHistory
        tokenId={tokenId}
        projectId={projectId}
        botName={resolvedBotName}
      />
    </div>
  );
}
