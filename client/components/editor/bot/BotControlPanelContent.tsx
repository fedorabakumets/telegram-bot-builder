/**
 * @fileoverview Контент панели управления ботами
 *
 * Компонент отображает интерфейс управления ботами.
 *
 * @module BotControlPanelContent
 */

import { BotManagementInterface } from './BotManagementInterface';

interface BotControlPanelContentProps {
  projects: any[];
  allTokens: any[][];
  allBotInfos: any[];
  setProjectForNewBot: (projectId: number | null) => void;
  setShowAddBot: (show: boolean) => void;
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
  setSelectedProject: (project: any) => void;
  setSelectedBotInfo: (info: any) => void;
  setIsProfileSheetOpen: (open: boolean) => void;
}

/**
 * Контент панели управления ботами
 */
export function BotControlPanelContent({
  projects,
  allTokens,
  allBotInfos,
  setProjectForNewBot,
  setShowAddBot,
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
  setSelectedProject,
  setSelectedBotInfo,
  setIsProfileSheetOpen
}: BotControlPanelContentProps) {
  return (
    <BotManagementInterface
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
  );
}
