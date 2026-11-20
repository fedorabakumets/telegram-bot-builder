/** @fileoverview Горизонтальная шапка редактора в общем каркасе рабочих вкладок. */
import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { WorkspaceAdaptiveHeader } from '@/components/ui/workspace-adaptive-header';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { cn } from '@/utils/utils';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';

/** Содержимое горизонтальной шапки редактора. */
interface EditorHorizontalHeaderProps {
  /** Заголовок рабочей области. */
  title?: string;
  /** Иконка рабочей области. */
  icon?: ReactNode;
  /** Название текущего проекта. */
  projectName: string;
  /** Проекты, доступные в выпадающем списке. */
  projects?: Array<{
    /** Идентификатор проекта. */
    id: number;
    /** Название проекта. */
    name: string;
  }>;
  /** Идентификатор выбранного проекта. */
  currentProjectId?: number;
  /** Переключает проект. */
  onProjectChange?: (id: number) => void;
  /** Действия, относящиеся к текущему проекту. */
  projectActions?: ReactNode;
  /** Справка и обучение по текущей области. */
  help?: ReactNode;
  /** Дополнительные действия при использовании горизонтальной шапки. */
  fallbackActions?: ReactNode;
  /** Дополнительное оформление контейнера. */
  className?: string;
}

/**
 * Выводит заголовок, проект и доступные действия с переносом при недостатке места.
 * @param props - Название рабочей области, проект и действия.
 * @returns Горизонтальная шапка редактора.
 */
export function EditorHorizontalHeader({
  title = 'Редактор', icon = <LayoutDashboard />, projectName, projects, currentProjectId,
  onProjectChange, projectActions, help, fallbackActions, className,
}: EditorHorizontalHeaderProps) {
  const actions = (help || fallbackActions) && (
    <div className="editor-horizontal-header-actions flex min-w-0 flex-wrap items-center justify-end gap-2">
      {help}
      {fallbackActions}
    </div>
  );

  return (
    // Отступы и высоту задаёт общая панель рабочих вкладок.
    <div className={cn('workspace-tab-frame workspace-tab-bar @container shrink-0 border-b border-border/50 bg-background', className)}>
      <WorkspaceAdaptiveHeader className="editor-horizontal-header" actionsSelector=".editor-horizontal-header-actions">
        <WorkspaceTabHeading title={title} icon={icon} actions={actions} />
        {/** Одиночный селектор может занимать оставшееся место между названием и справкой. */}
        <div role="group" aria-label="Проект" className={projectActions ? undefined : 'workspace-project-scope'}>
          <WorkspaceHeaderActionItems kind="selectors" items={[{ id: 'project', content: projects?.length && currentProjectId != null && onProjectChange ? (
            <ProjectSelector
              projects={projects}
              selectedProjectId={currentProjectId}
              selectedProjectName={projectName}
              ariaLabel="Выбрать проект"
              onSelect={onProjectChange}
            />
          ) : (
            projectName && <span className="min-w-0 truncate text-sm" title={projectName}>{projectName}</span>
          ) }]} />
          {projectActions}
        </div>
      </WorkspaceAdaptiveHeader>
    </div>
  );
}
