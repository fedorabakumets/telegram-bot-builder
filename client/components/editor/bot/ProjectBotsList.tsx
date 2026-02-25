/**
 * @fileoverview Список ботов проекта
 *
 * Компонент отображает карточки всех ботов в проекте.
 *
 * @module ProjectBotsList
 */

import { BotCard } from './BotCard';

interface ProjectBotsListProps {
  project: any;
  projectTokens: any[];
  projectBotInfo: any;
  allBotStatuses: any[];
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
  toggleDatabaseMutation: any;
  queryClient: any;
}

/**
 * Список ботов проекта
 */
export function ProjectBotsList({
  project,
  projectTokens,
  projectBotInfo,
  allBotStatuses,
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
  toggleDatabaseMutation,
  queryClient
}: ProjectBotsListProps) {
  return (
    <div className="grid gap-4">
      {projectTokens.map((token) => {
        const tokenStatus = allBotStatuses.find(status => status.instance && status.instance.tokenId === token.id);
        const isThisTokenRunning = tokenStatus?.status === 'running';

        return (
          <BotCard
            key={token.id}
            token={token}
            project={project}
            projectBotInfo={projectBotInfo}
            isThisTokenRunning={isThisTokenRunning}
            editingField={editingField}
            editValue={editValue}
            setEditValue={setEditValue}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            handleStartEdit={handleStartEdit}
            getStatusBadge={getStatusBadge}
            startBotMutation={startBotMutation}
            stopBotMutation={stopBotMutation}
            deleteBotMutation={deleteBotMutation}
            setSelectedProject={setSelectedProject}
            setSelectedBotInfo={setSelectedBotInfo}
            setIsProfileSheetOpen={setIsProfileSheetOpen}
            commentsGenerationEnabled={commentsGenerationEnabled}
            handleToggleCommentsGeneration={handleToggleCommentsGeneration}
            currentElapsedSeconds={currentElapsedSeconds}
            allBotStatuses={allBotStatuses}
            toggleDatabaseMutation={toggleDatabaseMutation}
            queryClient={queryClient}
          />
        );
      })}
    </div>
  );
}
