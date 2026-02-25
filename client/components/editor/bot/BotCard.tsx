/**
 * @fileoverview Карточка бота
 *
 * Компонент объединяет все части карточки бота:
 * - Заголовок с аватаркой и именем
 * - Информация о боте
 * - Кнопки действий
 * - Сетка настроек
 *
 * @module BotCard
 */

import { Card, CardContent } from '@/components/ui/card';
import { BotCardHeader } from './BotCardHeader';
import { BotCardInfo } from './BotCardInfo';
import { BotSettingsGrid } from './BotSettingsGrid';

interface BotCardProps {
  token: any;
  project: any;
  projectBotInfo: any;
  isThisTokenRunning: boolean;
  editingField: { tokenId: number; field: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  getStatusBadge: (token: any) => JSX.Element;
  startBotMutation: any;
  stopBotMutation: any;
  deleteBotMutation: any;
  setSelectedProject: (project: any) => void;
  setSelectedBotInfo: (info: any) => void;
  setIsProfileSheetOpen: (open: boolean) => void;
  commentsGenerationEnabled: boolean;
  handleToggleCommentsGeneration: (enabled: boolean) => void;
  currentElapsedSeconds: Record<number, number>;
  allBotStatuses: any[];
  toggleDatabaseMutation: any;
  queryClient: any;
}

/**
 * Карточка бота
 */
export function BotCard({
  token,
  project,
  projectBotInfo,
  isThisTokenRunning,
  editingField,
  editValue,
  setEditValue,
  handleSaveEdit,
  handleCancelEdit,
  handleStartEdit,
  getStatusBadge,
  startBotMutation,
  stopBotMutation,
  deleteBotMutation,
  setSelectedProject,
  setSelectedBotInfo,
  setIsProfileSheetOpen,
  commentsGenerationEnabled,
  handleToggleCommentsGeneration,
  currentElapsedSeconds,
  allBotStatuses,
  toggleDatabaseMutation,
  queryClient
}: BotCardProps) {
  return (
    <Card className="group/card overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 hover:border-border/50">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
      <CardContent className="p-4 sm:p-5 space-y-4">
        <BotCardHeader
          token={token}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          getStatusBadge={getStatusBadge}
          isBotRunning={isThisTokenRunning}
          startBotMutation={startBotMutation}
          stopBotMutation={stopBotMutation}
          deleteBotMutation={deleteBotMutation}
          onEditProfile={() => {
            setSelectedProject(project);
            setSelectedBotInfo(projectBotInfo);
            setIsProfileSheetOpen(true);
          }}
          isProfileLoading={!projectBotInfo}
          tokenId={token.id}
          projectId={project.id}
        />

        <BotCardInfo
          token={token}
          project={project}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          queryClient={queryClient}
        />

        <BotSettingsGrid
          projectId={project.id}
          tokenId={token.id}
          userDatabaseEnabled={project.userDatabaseEnabled}
          commentsGenerationEnabled={commentsGenerationEnabled}
          isBotRunning={isThisTokenRunning}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
          toggleDatabaseMutation={toggleDatabaseMutation}
          handleToggleCommentsGeneration={handleToggleCommentsGeneration}
        />
      </CardContent>
    </Card>
  );
}
