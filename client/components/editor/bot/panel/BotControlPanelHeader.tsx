/**
 * @fileoverview Заголовок панели управления ботами
 * @description Компактный TabHeader с проектом, worker pool и bulk-действиями
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { WorkerPoolStatus } from './WorkerPoolStatus';
import { BotViewModeToggle } from '../canvas/BotViewModeToggle';
import { ProjectBotBulkActions } from '../project/ProjectBotBulkActions';
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
  const isGuestUser = !authLoading && (!user || isGuest(user));
  const {
    allBotStatuses,
    restartAllBotsMutation,
    startOfflineAllMutation,
  } = useBotControl();

  const projectName =
    allProjects?.find((p) => p.id === currentProjectId)?.name ?? '';
  const offlineCount = currentProjectTokens.filter((t) => {
    const st = allBotStatuses.find((s) => s.tokenId === t.id);
    return st?.status !== 'running';
  }).length;
  const startingThis =
    !!currentProjectId
    && startOfflineAllMutation.isPending
    && startOfflineAllMutation.variables === currentProjectId;

  return (
    <TabHeader
      icon={<Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
      title="Боты"
      singleLine
      actions={
        <>
          <BotViewModeToggle mode={viewMode} onModeChange={onViewModeChange} />
          {!isGuestUser && (
            <Button
              variant="outline"
              onClick={onConnectBot}
              className="gap-1.5 h-8 px-2 @[560px]:px-3 text-sm flex-shrink-0"
              data-testid="button-connect-bot"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden @[560px]:inline">Подключить бот</span>
            </Button>
          )}
        </>
      }
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId ? (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={currentProjectId}
            onSelect={onProjectChange}
          />
        ) : null}
        <WorkerPoolStatus projects={allProjects} />
        {currentProjectId != null && (
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
        )}
      </div>
    </TabHeader>
  );
}
