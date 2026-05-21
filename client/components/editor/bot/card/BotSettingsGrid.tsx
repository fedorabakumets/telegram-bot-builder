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
import { BotProtectContentToggle } from './BotProtectContentToggle';
import { BotSaveMediaToggle } from './BotSaveMediaToggle';
import { BotAdminIds } from '../profile/BotAdminIds';
import { ProjectCollaborators } from '../profile/ProjectCollaborators';
import { BotLaunchHistory } from './BotLaunchHistory';
import { BotLaunchSettings } from './BotLaunchSettings';
import { BotUserbotSettings } from './BotUserbotSettings';
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
  token: Pick<BotToken, 'id' | 'autoRestart' | 'maxRestartAttempts' | 'logLevel' | 'protectContent' | 'saveIncomingMedia' | 'userbotEnabled' | 'userbotApiId' | 'userbotApiHash' | 'userbotSessionString'>;
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
  /** Колбэк для добавления изменения в pending */
  onPendingChange?: (key: string, value: string) => void;
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
  onPendingChange,
}: BotSettingsGridProps) {
  const resolvedBotName = botName ?? `Бот ${tokenId}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      <BotLaunchSettings
        tokenId={tokenId}
        projectId={projectId}
        launchMode={launchMode}
        webhookBaseUrl={webhookBaseUrl}
        webhookSecretToken={webhookSecretToken}
        className="sm:col-span-2"
        onPendingChange={onPendingChange}
      />
      <BotDatabaseToggle
        projectId={projectId}
        tokenId={tokenId}
        userDatabaseEnabled={userDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
        onPendingChange={onPendingChange}
      />
      <BotAutoRestartToggle
        projectId={projectId}
        tokenId={tokenId}
        autoRestart={token.autoRestart}
        maxRestartAttempts={token.maxRestartAttempts}
        onPendingChange={onPendingChange ? (ar, ma) => {
          onPendingChange('AUTO_RESTART', ar);
          onPendingChange('MAX_RESTART_ATTEMPTS', ma);
        } : undefined}
      />
      <BotLogLevelSelect
        projectId={projectId}
        tokenId={tokenId}
        logLevel={token.logLevel ?? 'WARNING'}
        onPendingChange={onPendingChange}
      />
      <BotProtectContentToggle
        projectId={projectId}
        tokenId={tokenId}
        protectContent={token.protectContent ?? 0}
        onPendingChange={onPendingChange}
      />
      <BotSaveMediaToggle
        projectId={projectId}
        tokenId={tokenId}
        saveIncomingMedia={token.saveIncomingMedia ?? 0}
        userDatabaseEnabled={userDatabaseEnabled}
        onPendingChange={onPendingChange}
      />
      {isBotRunning && (
        <BotExecutionTimer
          tokenId={tokenId}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
        />
      )}
      <BotAdminIds projectId={projectId} onPendingChange={onPendingChange} />
      <ProjectCollaborators projectId={projectId} canManage={canManage} />
      <BotLaunchHistory
        tokenId={tokenId}
        projectId={projectId}
        botName={resolvedBotName}
      />
      <BotUserbotSettings
        projectId={projectId}
        tokenId={tokenId}
        userbotEnabled={token.userbotEnabled ?? 0}
        userbotApiId={token.userbotApiId ?? null}
        userbotApiHash={token.userbotApiHash ?? null}
        userbotSessionString={token.userbotSessionString ?? null}
        onPendingChange={onPendingChange}
      />
    </div>
  );
}
