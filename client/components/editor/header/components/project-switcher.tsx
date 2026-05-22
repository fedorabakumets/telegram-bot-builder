/**
 * @fileoverview Переключатель проекта в стиле Railway
 * @description Компонент выбора активного проекта через дропдаун без рамки и фона
 */

import { ChevronDown, FolderOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Свойства переключателя проекта
 */
export interface ProjectSwitcherProps {
  /** Список доступных проектов */
  projects: Array<{ id: number; name: string }>;
  /** ID текущего активного проекта */
  currentProjectId: number;
  /** Обработчик выбора проекта */
  onSelect: (id: number) => void;
}

/**
 * Переключатель проекта в стиле Railway — текст + стрелка, без рамки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectSwitcher({ projects, currentProjectId, onSelect }: ProjectSwitcherProps) {
  const current = projects.find((p) => p.id === currentProjectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 px-1.5 gap-1 text-sm font-medium border-none shadow-none focus-visible:ring-0 min-w-0"
        >
          <span className="truncate max-w-[60vw] sm:max-w-[250px] md:max-w-none">{current?.name ?? 'Проект'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-48">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onSelect(project.id)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 truncate">{project.name}</span>
            {project.id === currentProjectId && (
              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
