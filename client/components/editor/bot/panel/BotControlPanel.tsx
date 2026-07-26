/**
 * @fileoverview Панель управления ботами
 *
 * Главный компонент панели управления ботами.
 * Данные редактирования и мутации берёт из BotControlContext.
 * Принимает только данные, недоступные в контексте:
 * - состояние загрузки проектов
 * - список проектов и токенов
 * - состояние диалога добавления бота
 *
 * @module BotControlPanel
 */

import { BotControlPanelHeader } from './BotControlPanelHeader';
import { BotControlPanelLoading } from './BotControlPanelLoading';
import { BotControlPanelEmpty } from './BotControlPanelEmpty';
import { BotManagementInterface } from './BotManagementInterface';
import { GuestBanner } from './GuestBanner';
import { AddBotDialog } from '../add-bot/AddBotDialog';
import { useBotControl } from '../bot-control-context';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { isGuest } from '@/types/telegram-user';
import { useBotViewMode } from '../canvas/use-bot-view-mode';
import type { BotProject, BotToken } from '@shared/schema';

/**
 * Свойства панели управления ботами
 */
interface BotControlPanelProps {
  /** Загружаются ли проекты */
  projectsLoading: boolean;
  /** Список проектов */
  projects: BotProject[];
  /** Токены по каждому проекту */
  allTokens: BotToken[][];
  /** Показывать ли диалог добавления бота */
  showAddBot: boolean;
  /** ID проекта для нового бота */
  projectForNewBot: number | null;
  /** Токен нового бота */
  newBotToken: string;
  /** Обновить токен нового бота */
  setNewBotToken: (token: string) => void;
  /** Идёт ли парсинг информации о боте */
  isParsingBot: boolean;
  /** Мутация создания бота */
  createBotMutation: { isPending: boolean };
  /** Обработчик добавления бота */
  handleAddBot: (selectedTokenId?: number | null) => void;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** ID текущего проекта */
  currentProjectId?: number;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Панель управления ботами
 */
export function BotControlPanel({
  projectsLoading,
  projects,
  allTokens,
  showAddBot,
  projectForNewBot,
  newBotToken,
  setNewBotToken,
  isParsingBot,
  createBotMutation,
  handleAddBot,
  allProjects,
  currentProjectId,
  onProjectChange,
}: BotControlPanelProps) {
  const { setShowAddBot, setProjectForNewBot, allTokensFlat, allBotStatuses } = useBotControl();
  const { user, isLoading: authLoading } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();
  const { viewMode, setViewMode } = useBotViewMode();

  /** Является ли текущий пользователь гостем */
  const isGuestUser = !authLoading && (!user || isGuest(user));
  /** Есть ли хотя бы один запущенный бот */
  const hasRunningBot = allBotStatuses.some(s => s?.status === 'running');
  const isCanvas = viewMode === 'canvas';

  return (
    <div className="flex flex-col h-full bg-background">
      <BotControlPanelHeader
        onConnectBot={() => setShowAddBot(true)}
        allProjects={allProjects}
        currentProjectId={currentProjectId}
        onProjectChange={onProjectChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div
        className={
          isCanvas
            ? 'flex-1 min-h-0 overflow-hidden p-0 sm:p-0'
            : 'flex-1 overflow-auto p-4 sm:p-6 space-y-4 sm:space-y-6'
        }
      >
        {isGuestUser && !isCanvas && (
          <GuestBanner
            hasRunningBot={hasRunningBot}
            onLogin={handleTelegramLogin}
          />
        )}

        {projectsLoading ? (
          <BotControlPanelLoading />
        ) : projects.length === 0 ? (
          <BotControlPanelEmpty />
        ) : (
          <BotManagementInterface
            projects={projects}
            allTokens={allTokens}
            currentProjectId={currentProjectId}
            viewMode={viewMode}
          />
        )}
      </div>

      <AddBotDialog
        showAddBot={showAddBot}
        setShowAddBot={setShowAddBot}
        projectForNewBot={projectForNewBot}
        setProjectForNewBot={setProjectForNewBot}
        projects={projects}
        newBotToken={newBotToken}
        setNewBotToken={setNewBotToken}
        isParsingBot={isParsingBot}
        createBotMutation={createBotMutation}
        handleAddBot={handleAddBot}
        allTokensFlat={allTokensFlat}
      />
    </div>
  );
}
