/**
 * @fileoverview Заголовок панели управления ботами
 * @description Компактный TabHeader с проектом, worker pool и bulk-действиями
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { useQueryClient } from '@tanstack/react-query';
import { projectBotStatusesQueryKey } from '../project-bot-statuses-query';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { WorkerPoolStatus } from './WorkerPoolStatus';
import { BotViewModeToggle } from '../canvas/BotViewModeToggle';
import { ProjectBotBulkActions } from '../project/ProjectBotBulkActions';
import { countStartableOfflineBots } from '../project/count-startable-offline-bots';
import { useBotControl } from '../bot-control-context';
import type { BotViewMode } from '../canvas/use-bot-view-mode';
import type { BotToken } from '@shared/schema';

/** Свойства заголовка панели управления ботами */
interface BotControlPanelHeaderProps {
  /** Обработчик нажатия кнопки подключения бота */
  onConnectBot: () => void;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** ID текущего проекта */
  currentProjectId?: number;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
  /** Режим Список / Холст */
  viewMode: BotViewMode;
  /** Смена режима вида */
  onViewModeChange: (mode: BotViewMode) => void;
  /** Токены текущего проекта (для offline-счётчика) */
  currentProjectTokens?: BotToken[];
}

/**
 * Компактный заголовок панели управления ботами
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка
 */
export function BotControlPanelHeader({
  onConnectBot,
  allProjects,
  currentProjectId,
  onProjectChange,
  viewMode,
  onViewModeChange,
  currentProjectTokens = [],
}: BotControlPanelHeaderProps) {
  const { user, isLoading: authLoading } = useTelegramAuth();
  const queryClient = useQueryClient();
  /** Перечитывает данные выбранного проекта и сводку воркеров. */
  const refreshBots = () => {
    void queryClient.invalidateQueries({ queryKey: ['/api/workers/stats'] });
    if (currentProjectId == null) return;
    void queryClient.invalidateQueries({ queryKey: projectBotStatusesQueryKey(currentProjectId) });
    void queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/tokens`] });
  };
  const isGuestUser = !authLoading && (!user || isGuest(user));
  const {
    allBotStatuses,
    restartAllBotsMutation,
    startOfflineAllMutation,
  } = useBotControl();

  const projectName =
    allProjects?.find((p) => p.id === currentProjectId)?.name ?? '';
  const offlineCount = countStartableOfflineBots(currentProjectTokens, allBotStatuses);
  const startingThis =
    !!currentProjectId
    && startOfflineAllMutation.isPending
    && startOfflineAllMutation.variables === currentProjectId;

  return (
    <TabHeader
      icon={<Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
      title="Боты"
      className="bot-workspace-header sm:px-4"
      singleLine
      actions={
        <>
          <BotViewModeToggle mode={viewMode} onModeChange={onViewModeChange} />
          {!isGuestUser && (
            <Button
              variant="outline"
              onClick={onConnectBot}
              className="gap-1.5 h-8 px-2 @[920px]:px-3 text-sm flex-shrink-0"
              aria-label="Подключить бот"
              title="Подключить бот"
              data-testid="button-connect-bot"
            >
              <Plus className="h-4 w-4" />
              {/* На средней ширине иконка освобождает место для названия проекта. */}
              <span className="hidden @[920px]:inline">Подключить</span>
            </Button>
          )}
          {/* Служебные действия идут после подключения бота. */}
          <WorkspaceTabActions docsPath="interface/bot" section="Боты" onRefresh={refreshBots} />
        </>
      }
    >
      {/* На десктопе проект и управление воркерами остаются в общей строке. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 sm:flex-nowrap">
        {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId ? (
          <div className="w-40 min-w-0 max-w-full shrink @[920px]:w-auto">
            {/* Даёт имени проекта место рядом со счётчиком и сжимается в узкой панели. */}
            <ProjectSelector
              projects={allProjects}
              selectedProjectId={currentProjectId}
              onSelect={onProjectChange}
            />
          </div>
        ) : null}
        <WorkerPoolStatus projects={allProjects} />
        {currentProjectId != null && (
          <div className="shrink-0 sm:[&_*[data-bulk-label]]:hidden @[920px]:[&_*[data-bulk-label]]:inline">
          <ProjectBotBulkActions
            projectId={currentProjectId}
            projectName={projectName}
            botsCount={currentProjectTokens.length}
            onRestartAll={() => restartAllBotsMutation.mutate(currentProjectId)}
            isRestartingAll={restartAllBotsMutation.isPending}
            offlineCount={offlineCount}
            onStartOfflineAll={() => startOfflineAllMutation.mutate(currentProjectId)}
            isStartingOffline={startingThis}
          />
          </div>
        )}
      </div>
    </TabHeader>
  );
}
