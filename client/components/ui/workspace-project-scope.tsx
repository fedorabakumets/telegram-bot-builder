/** @fileoverview Единый выбор проекта в рабочих вкладках без выхода в другой раздел. */
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';

/** Параметры переключения проекта рабочей вкладки. */
export interface WorkspaceProjectScopeProps {
  /** Текущий проект. */
  projectId: number;
  /** Доступные проекты. */
  projects?: Array<{ /** Идентификатор проекта. */ id: number; /** Название проекта. */ name: string }>;
  /** Переход к проекту с сохранением текущей вкладки. */
  onProjectChange?: (id: number) => void;
}

/**
 * Выводит доступный селектор проекта с общей геометрией поля.
 * @param props - Список, выбранный проект и обработчик
 * @returns Селектор либо отсутствие элемента без обработчика
 */
export function WorkspaceProjectScope({ projectId, projects, onProjectChange }: WorkspaceProjectScopeProps) {
  return projects?.length && onProjectChange ? <div className="workspace-project-scope" role="group" aria-label="Проект">
    <ProjectSelector projects={projects} selectedProjectId={projectId} onSelect={onProjectChange} />
  </div> : null;
}
