/**
 * @fileoverview Заголовок панели управления ботами
 * @description Компактный заголовок с иконкой, переключателем проекта и кнопкой подключения бота
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { WorkerPoolStatus } from './WorkerPoolStatus';

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
}

/**
 * Компактный заголовок панели управления ботами
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка
 */
export function BotControlPanelHeader({ onConnectBot, allProjects, currentProjectId, onProjectChange }: BotControlPanelHeaderProps) {
  const { user, isLoading: authLoading } = useTelegramAuth();
  const isGuestUser = !authLoading && (!user || isGuest(user));

  return (
    <TabHeader
      icon={<Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
      title="Боты"
      actions={
        <>
          {!isGuestUser && (
            <Button
              variant="outline"
              onClick={onConnectBot}
              className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
              data-testid="button-connect-bot"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Подключить бот</span>
            </Button>
          )}
          <WorkerPoolStatus projects={allProjects} />
        </>
      }
    >
      {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId && (
        <ProjectSelector
          projects={allProjects}
          selectedProjectId={currentProjectId}
          onSelect={onProjectChange}
        />
      )}
    </TabHeader>
  );
}
