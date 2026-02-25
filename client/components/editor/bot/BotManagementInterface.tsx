/**
 * @fileoverview Интерфейс управления ботами
 *
 * Компонент отображает интерфейс управления ботами для всех проектов:
 * - Заголовки проектов
 * - Списки ботов или состояние отсутствия ботов
 *
 * @module BotManagementInterface
 */

import { ProjectHeader } from './ProjectHeader';
import { EmptyBotsState } from './EmptyBotsState';
import { ProjectBotsList } from './ProjectBotsList';

interface BotManagementInterfaceProps {
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
  queryClient: any;
}

/**
 * Интерфейс управления ботами
 */
export function BotManagementInterface({
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
  startBotMutation,
  stopBotMutation,
  deleteBotMutation,
  toggleDatabaseMutation,
  handleToggleCommentsGeneration,
  commentsGenerationEnabled,
  currentElapsedSeconds,
  setSelectedProject,
  setSelectedBotInfo,
  setIsProfileSheetOpen,
  queryClient
}: BotManagementInterfaceProps) {
  return (
    <div className="space-y-8">
      {projects.map((project, projectIndex) => {
        const projectTokens = allTokens[projectIndex] || [];
        const projectBotInfo = allBotInfos[projectIndex];

        return (
          <div key={project.id} className="space-y-4">
            <ProjectHeader
              projectName={project.name}
              botsCount={projectTokens.length}
            />

            {projectTokens.length === 0 ? (
              <EmptyBotsState
                onAddBot={() => {
                  setProjectForNewBot(project.id);
                  setShowAddBot(true);
                }}
              />
            ) : (
              <ProjectBotsList
                project={project}
                projectTokens={projectTokens}
                projectBotInfo={projectBotInfo}
                allBotStatuses={allBotStatuses}
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
                handleToggleCommentsGeneration={handleToggleCommentsGeneration}
                commentsGenerationEnabled={commentsGenerationEnabled}
                currentElapsedSeconds={currentElapsedSeconds}
                toggleDatabaseMutation={toggleDatabaseMutation}
                queryClient={queryClient}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
