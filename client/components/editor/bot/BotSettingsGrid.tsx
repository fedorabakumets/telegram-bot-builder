/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Таймер выполнения (только когда бот запущен)
 * - Список администраторов
 *
 * Когда бот не запущен и число элементов нечётное,
 * последний элемент растягивается на всю ширину через col-span-full.
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotExecutionTimer } from './BotExecutionTimer';
import { BotAdminIds } from './BotAdminIds';

interface BotSettingsGridProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Включена ли база данных пользователей (1 — да, 0/null — нет) */
  userDatabaseEnabled: number | null;
  /** Запущен ли бот */
  isBotRunning: boolean;
  /** Текущее время работы ботов в секундах (ключ — tokenId) */
  currentElapsedSeconds: Record<number, number>;
  /** Статусы всех ботов */
  allBotStatuses: unknown[];
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: {
    isPending: boolean;
    mutate: (enabled: boolean) => void;
  };
}

/**
 * Сетка настроек бота
 */
export function BotSettingsGrid({
  projectId,
  tokenId,
  userDatabaseEnabled,
  isBotRunning,
  currentElapsedSeconds,
  allBotStatuses,
  toggleDatabaseMutation,
}: BotSettingsGridProps) {
  // Считаем количество элементов в сетке (без BotAdminIds — он всегда col-span-full)
  // Элементы: BotDatabaseToggle (всегда) + BotExecutionTimer (только при запущенном боте)
  const itemCount = isBotRunning ? 2 : 1;
  // Если нечётное число элементов — последний занимает всю ширину
  const dbToggleClass = itemCount === 1 ? 'col-span-full' : '';

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
    </div>
  );
}
