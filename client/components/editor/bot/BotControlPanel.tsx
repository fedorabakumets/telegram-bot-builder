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
import { AddBotDialog } from './AddBotDialog';
import { useBotControl } from './bot-control-context';
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
}: BotControlPanelProps) {
  const { setShowAddBot, setProjectForNewBot, allTokensFlat } = useBotControl();

  return (
    <div className="space-y-4 sm:space-y-6">
      <BotControlPanelHeader onConnectBot={() => setShowAddBot(true)} />

      {projectsLoading ? (
        <BotControlPanelLoading />
      ) : projects.length === 0 ? (
        <BotControlPanelEmpty />
      ) : (
        <BotManagementInterface
          projects={projects}
          allTokens={allTokens}
        />
      )}

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
