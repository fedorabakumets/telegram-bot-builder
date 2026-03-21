/**
 * @fileoverview Контекст управления ботами
 *
 * Хранит общий стейт панели управления ботами,
 * устраняя prop drilling через 6 уровней компонентов.
 *
 * @module bot-control-context
 */

import { createContext, useContext, ReactNode } from 'react';
import type { BotStatusResponse, BotInfo, EditingField } from './bot-types';

/**
 * Значение контекста управления ботами
 */
interface BotControlContextValue {
  /** Статусы всех ботов */
  allBotStatuses: BotStatusResponse[];
  /** Информация о ботах из Telegram API */
  allBotInfos: BotInfo[];
  /** Текущее время работы ботов в секундах (ключ — tokenId) */
  currentElapsedSeconds: Record<number, number>;

  /** Редактируемое поле */
  editingField: EditingField | null;
  /** Значение редактируемого поля */
  editValue: string;
  /** Обновить значение редактируемого поля */
  setEditValue: (value: string) => void;
  /** Начать редактирование поля */
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  /** Сохранить изменения */
  handleSaveEdit: () => void;
  /** Отменить редактирование */
  handleCancelEdit: () => void;

  /** Получить бейдж статуса для токена */
  getStatusBadge: (token: unknown) => JSX.Element;

  /** Мутация запуска бота */
  startBotMutation: {
    isPending: boolean;
    variables?: { tokenId: number; projectId: number };
    mutate: (vars: { tokenId: number; projectId: number }) => void;
  };
  /** Мутация остановки бота */
  stopBotMutation: {
    isPending: boolean;
    variables?: { tokenId: number; projectId: number };
    mutate: (vars: { tokenId: number; projectId: number }) => void;
  };
  /** Мутация удаления бота */
  deleteBotMutation: {
    isPending: boolean;
    variables?: number;
    mutate: (tokenId: number) => void;
  };
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: {
    isPending: boolean;
    mutate: (enabled: boolean) => void;
  };

  /** Установить выбранный проект для редактирования профиля */
  setSelectedProject: (project: unknown) => void;
  /** Установить информацию о боте для редактирования профиля */
  setSelectedBotInfo: (info: unknown) => void;
  /** Открыть/закрыть панель профиля */
  setIsProfileSheetOpen: (open: boolean) => void;

  /** QueryClient для инвалидации кэша */
  queryClient: {
    invalidateQueries: (opts: { queryKey: unknown[] }) => void;
  };

  /** Показать диалог добавления бота */
  setShowAddBot: (show: boolean) => void;
  /** Установить проект для нового бота */
  setProjectForNewBot: (projectId: number | null) => void;
}

const BotControlContext = createContext<BotControlContextValue | null>(null);

/**
 * Провайдер контекста управления ботами
 */
export function BotControlProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: BotControlContextValue;
}) {
  return (
    <BotControlContext.Provider value={value}>
      {children}
    </BotControlContext.Provider>
  );
}

/**
 * Хук для доступа к контексту управления ботами
 * @throws Если используется вне BotControlProvider
 */
export function useBotControl(): BotControlContextValue {
  const ctx = useContext(BotControlContext);
  if (!ctx) {
    throw new Error('useBotControl должен использоваться внутри BotControlProvider');
  }
  return ctx;
}
