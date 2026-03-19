/**
 * @fileoverview Компонент списка проектов в sidebar
 * Отображает список проектов с поддержкой drag-and-drop
 * @module components/editor/sidebar/components/ProjectList
 */

import React from 'react';
import { BotProject } from '@shared/schema';
import { cn } from '@/utils/utils';
import { formatDate } from '../handlers/format-date';
import { getNodeCount } from '../handlers/get-node-count';
import { getSheetsInfo } from '../handlers/get-sheets-info';
import type { ProjectDragState } from '../types';

import { Calendar, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Пропсы для компонента ProjectList
 */
export interface ProjectListProps {
  /** Список проектов */
  projects: BotProject[];
  /** Активный проект */
  activeProject: BotProject | null;
  /** Состояние drag-and-drop */
  dragState: ProjectDragState;
  /** Обработчик выбора проекта */
  onProjectSelect: (project: BotProject) => void;
  /** Обработчик удаления проекта */
  onProjectDelete: (project: BotProject) => void;
  /** Обработчик начала перетаскивания */
  onDragStart: (e: React.DragEvent, project: BotProject) => void;
  /** Обработчик наведения при перетаскивании */
  onDragOver: (e: React.DragEvent, projectId: number) => void;
  /** Обработчик ухода при перетаскивании */
  onDragLeave: () => void;
  /** Обработчик сброса при перетаскивании */
  onDrop: (e: React.DragEvent, targetProject: BotProject) => void;
}

/**
 * Компонент списка проектов
 */
export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  activeProject,
  dragState,
  onProjectSelect,
  onProjectDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  if (projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Нет проектов</p>
        <p className="text-sm">Создайте первый проект</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const nodeCount = getNodeCount(project);
        const sheetsInfo = getSheetsInfo(project);
        const isDragged = dragState.draggedProject?.id === project.id;
        const isDragOver = dragState.dragOverProject === project.id;

        return (
          <div
            key={project.id}
            className={cn(
              'group relative flex items-center gap-2 p-3 rounded-lg border transition-all',
              activeProject?.id === project.id && 'border-primary bg-primary/5',
              isDragged && 'opacity-50 scale-95',
              isDragOver && 'border-primary border-dashed bg-primary/10',
              'hover:shadow-md'
            )}
            draggable
            onDragStart={(e) => onDragStart(e, project)}
            onDragOver={(e) => onDragOver(e, project.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, project)}
          >
            {/* Handle для перетаскивания */}
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

            {/* Информация о проекте */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <h3 className="font-medium truncate">{project.name}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(project.createdAt)}
                </span>
                <span>{nodeCount} узлов</span>
                {sheetsInfo.count > 1 && (
                  <span>{sheetsInfo.count} листов</span>
                )}
              </div>
            </div>

            {/* Кнопка удаления */}
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onProjectDelete(project);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
