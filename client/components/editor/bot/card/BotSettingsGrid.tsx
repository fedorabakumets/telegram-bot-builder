/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Таймер выполнения (только когда бот запущен)
 * - Список администраторов
 * - История запусков
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotExecutionTimer } from './BotExecutionTimer';
import { BotAdminIds } from '../profile/BotAdminIds';
import { BotLaunchHistory } from './BotLaunchHistory';
import type { BotStatusResponse } from '../bot-types';

/** Пропсы сетки настроек бота */
interface BotSettingsGridProps {
  /** ID проекта */
  projectId: number;
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
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: {
    /** Флаг ожидания ответа */
    isPending: boolean;
    /** Функция мутации */
    mutate: (enabled: boolean) => void;
  };
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
  toggleDatabaseMutation,
}: BotSettingsGridProps) {
  const itemCount = isBotRunning ? 2 : 1;
  const dbToggleClass = itemCount === 1 ? 'col-span-full' : '';
  const resolvedBotName = botName ?? `Бот ${tokenId}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <BotDatabaseToggle
        projectId={projectId}
        tokenId={tokenId}
        userDatabaseEnabled={userDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
        className={dbToggleClass}
      />
      {isBotRunning && (
        <BotExecutionTimer
          tokenId={tokenId}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
        />
      )}
      <BotAdminIds projectId={projectId} />
      <BotLaunchHistory
        tokenId={tokenId}
        projectId={projectId}
        botName={resolvedBotName}
      />
    </div>
  );
}
