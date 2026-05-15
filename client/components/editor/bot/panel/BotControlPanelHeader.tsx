/**
 * @fileoverview Заголовок панели управления ботами
 * @description Компактный заголовок с иконкой, переключателем проекта и кнопкой подключения бота
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
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
  const { user } = useTelegramAuth();
  const isGuestUser = !user || isGuest(user);

  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-gradient-to-r from-muted/40 to-background">
      <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
        <Bot className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-shrink-0">
        <h2 className="text-base font-semibold leading-none">Боты</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Управление ботами проекта</p>
      </div>
      {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId && (
        <ProjectSelector
          projects={allProjects}
          selectedProjectId={currentProjectId}
          onSelect={onProjectChange}
        />
      )}
      <WorkerPoolStatus />
      {!isGuestUser && (
        <Button
          variant="outline"
          onClick={onConnectBot}
          className="gap-1.5 h-9 px-3 text-sm ml-auto flex-shrink-0"
          data-testid="button-connect-bot"
        >
          <Plus className="w-4 h-4" />
          Подключить бот
        </Button>
      )}
    </div>
  );
}
