/**
 * @fileoverview Заголовок панели управления ботами
 * @description Компактный TabHeader с проектом, worker pool и bulk-действиями
 * @module BotControlPanelHeader
 */

import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';
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
import { BotWorkspaceModeSwitch, type BotWorkspaceMode } from '../accounts/BotWorkspaceModeSwitch';
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
  /** Выбранная область вкладки. */
  workspaceMode: BotWorkspaceMode;
  /** Переключает ботов и аккаунты. */
  onWorkspaceModeChange: (mode: BotWorkspaceMode) => void;
  /** Создаёт демонстрационный аккаунт. */
  onAddMockAccount: () => void;
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
  workspaceMode,
  onWorkspaceModeChange,
  onAddMockAccount,
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
      className="bot-workspace-header"
      actions={
        <>
        <BotWorkspaceModeSwitch mode={workspaceMode} onModeChange={onWorkspaceModeChange} />
        {workspaceMode === 'accounts' ? (
          <Button variant="outline" size="sm" onClick={onAddMockAccount}>
            <Plus className="size-4" aria-hidden="true" /> Аккаунт
          </Button>
        ) : <WorkspaceTabActions docsPath="interface/bot" section="Боты" onRefresh={refreshBots} before={[
          { id: 'view', content: <BotViewModeToggle mode={viewMode} onModeChange={onViewModeChange} /> },
          { id: 'connect', content: !isGuestUser && (
            <Button
              variant="outline"
              onClick={onConnectBot}
              className="gap-1.5 h-8 px-2 @[920px]:px-3 text-sm flex-shrink-0"
              aria-label="Подключить бот"
              title="Подключить бот"
              data-testid="button-connect-bot"
            >
              <Plus className="h-4 w-4" />
              {/* Подпись появляется, если помещается в общей шапке. */}
              <span data-workspace-label="connect">Подключить</span>
            </Button>
          ) },
        ]} />}
        </>
      }
    >
      {/* На узком экране область проекта и воркеров может переноситься. */}
      <div className="bot-workspace-scope flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
        <WorkspaceHeaderActionItems kind="selectors" items={[{ id: 'project', content: allProjects && allProjects.length > 1 && onProjectChange && currentProjectId ? (
          <div className="bot-workspace-project w-max min-w-0 max-w-full shrink">
            {/* Размер поля определяется названием и доступной шириной строки. */}
            <ProjectSelector
              projects={allProjects}
              selectedProjectId={currentProjectId}
              onSelect={onProjectChange}
            />
          </div>
        ) : null }]} />
        {workspaceMode === 'accounts' ? (
          <span className="text-xs text-muted-foreground">Демонстрационные данные</span>
        ) : <WorkerPoolStatus projects={allProjects} />}
        {workspaceMode === 'bots' && currentProjectId != null && (
          <div className="shrink-0">
          <ProjectBotBulkActions
            adaptiveLabels
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
