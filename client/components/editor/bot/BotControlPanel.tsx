/**
 * @fileoverview Панель управления ботами
 *
 * Главный компонент, объединяющий все части панели управления:
 * - Заголовок
 * - Состояние загрузки
 * - Состояние отсутствия проектов
 * - Контент с ботами
 * - Диалог добавления бота
 *
 * @module BotControlPanel
 */

import { BotControlPanelHeader } from './BotControlPanelHeader';
import { BotControlPanelLoading } from './BotControlPanelLoading';
import { BotControlPanelEmpty } from './BotControlPanelEmpty';
import { BotControlPanelContent } from './BotControlPanelContent';
import { AddBotDialog } from './AddBotDialog';

interface BotControlPanelProps {
  setShowAddBot: (show: boolean) => void;
  projectsLoading: boolean;
  projects: any[];
  allTokens: any[][];
  allBotInfos: any[];
  setProjectForNewBot: (projectId: number | null) => void;
  allBotStatuses: any[];
  editingField: { tokenId: number; field: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  getStatusBadge: (token: any) => JSX.Element;
  queryClient: any;
  startBotMutation: any;
  stopBotMutation: any;
  deleteBotMutation: any;
  toggleDatabaseMutation: any;
  handleToggleCommentsGeneration: (enabled: boolean) => void;
  commentsGenerationEnabled: boolean;
  currentElapsedSeconds: Record<number, number>;
  showAddBot: boolean;
  projectForNewBot: number | null;
  newBotToken: string;
  setNewBotToken: (token: string) => void;
  isParsingBot: boolean;
  createBotMutation: any;
  handleAddBot: () => void;
  setSelectedProject: (project: any) => void;
  setSelectedBotInfo: (info: any) => void;
  setIsProfileSheetOpen: (open: boolean) => void;
}

/**
 * Панель управления ботами
 */
export function BotControlPanel({
  setShowAddBot,
  projectsLoading,
  projects,
  allTokens,
  allBotInfos,
  setProjectForNewBot,
  allBotStatuses,
  editingField,
  editValue,
  setEditValue,
  handleSaveEdit,
  handleCancelEdit,
  handleStartEdit,
  getStatusBadge,
  queryClient,
  startBotMutation,
  stopBotMutation,
  deleteBotMutation,
  toggleDatabaseMutation,
  handleToggleCommentsGeneration,
  commentsGenerationEnabled,
  currentElapsedSeconds,
  showAddBot,
  projectForNewBot,
  newBotToken,
  setNewBotToken,
  isParsingBot,
  createBotMutation,
  handleAddBot,
  setSelectedProject,
  setSelectedBotInfo,
  setIsProfileSheetOpen
}: BotControlPanelProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <BotControlPanelHeader onConnectBot={() => setShowAddBot(true)} />

      {projectsLoading ? (
        <BotControlPanelLoading />
      ) : projects.length === 0 ? (
        <BotControlPanelEmpty />
      ) : (
        <BotControlPanelContent
          projects={projects}
          allTokens={allTokens}
          allBotInfos={allBotInfos}
          setProjectForNewBot={setProjectForNewBot}
          setShowAddBot={setShowAddBot}
          allBotStatuses={allBotStatuses}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          getStatusBadge={getStatusBadge}
          queryClient={queryClient}
          startBotMutation={startBotMutation}
          stopBotMutation={stopBotMutation}
          deleteBotMutation={deleteBotMutation}
          toggleDatabaseMutation={toggleDatabaseMutation}
          handleToggleCommentsGeneration={handleToggleCommentsGeneration}
          commentsGenerationEnabled={commentsGenerationEnabled}
          currentElapsedSeconds={currentElapsedSeconds}
          setSelectedProject={setSelectedProject}
          setSelectedBotInfo={setSelectedBotInfo}
          setIsProfileSheetOpen={setIsProfileSheetOpen}
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
      />
    </div>
  );
}
