/**
 * @fileoverview Компактный inline-селектор проекта для панели базы данных
 * @description Отображает Select с иконкой папки, аналогично BotTokenSelector
 */

import { FolderOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectOptionLabel } from './project-name-label';
import './project-selector.css';

/**
 * Пропсы селектора проекта
 */
interface ProjectSelectorProps {
  /** Список проектов */
  projects: Array<{ id: number; name: string }>;
  /** ID выбранного проекта */
  selectedProjectId: number;
  /** Обработчик выбора проекта */
  onSelect: (projectId: number) => void;
}

/**
 * Компактный inline-селектор проекта для панели базы данных
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора проекта
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
}: ProjectSelectorProps): React.JSX.Element {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={String(selectedProjectId)}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger aria-label="Проект пользователей" className="h-8 min-w-0 w-40 max-w-full rounded-lg border-border bg-background text-sm [&>span]:truncate">
          <SelectValue placeholder="Проект">{selectedProject?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent className="users-portal project-selector-menu" align="start" collisionPadding={12}>
          {projects.map((project) => (
            <SelectItem
              key={project.id}
              value={String(project.id)}
              className="py-2 pr-3"
              textValue={project.name}
            >
              <ProjectOptionLabel name={project.name} id={project.id} className="project-selector-option" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
