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
  return (
    <div className="flex items-center gap-1.5">
      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={String(selectedProjectId)}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger className="h-8 text-xs border-border/60 bg-background min-w-[120px] max-w-[180px]">
          <SelectValue placeholder="Проект" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
