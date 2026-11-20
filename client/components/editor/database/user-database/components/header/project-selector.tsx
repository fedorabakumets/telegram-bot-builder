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
import { useProjectBotCounts } from './use-project-bot-counts';
import { pluralizeBots } from '@/components/editor/broadcast/utils/format-bot-label';

/**
 * Пропсы селектора проекта
 */
interface ProjectSelectorProps {
  /** Список проектов */
  projects: Array<{ id: number; name: string }>;
  /** ID выбранного проекта */
  selectedProjectId: number;
  /** Название выбранного проекта, если он отсутствует в списке, например в архиве. */
  selectedProjectName?: string;
  /** Доступная подпись поля выбора. */
  ariaLabel?: string;
  /** Обработчик выбора проекта */
  onSelect: (projectId: number) => void;
  /** Показывать количество в закрытом поле; список всегда сохраняет полные подписи. */
  showBotCount?: boolean;
}

/**
 * Компактный inline-селектор проекта для панели базы данных
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора проекта
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  selectedProjectName,
  ariaLabel = 'Проект пользователей',
  onSelect,
  showBotCount = true,
}: ProjectSelectorProps): React.JSX.Element {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const counts = useProjectBotCounts(projects.length > 0);
  /** Подпись количества одинакова в выбранном значении и списке проектов. */
  const botCountLabel = (id: number) => {
    const count = counts.get(id);
    return count === undefined ? '—' : `${count.toLocaleString('ru-RU')} ${pluralizeBots(count)}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={String(selectedProjectId)}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger aria-label={ariaLabel} className="h-8 min-w-0 w-40 max-w-full rounded-lg border-border bg-background text-sm [&>span]:min-w-0 [&>span]:flex-1 [&>span]:text-left">
          <SelectValue placeholder="Проект"><span className="flex min-w-0 items-center justify-between gap-2">
            {/** В закрытом поле название важнее служебного ID; полная подпись остаётся в списке. */}
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="min-w-0 truncate">{selectedProject?.name ?? selectedProjectName}</span>
            </span>
            {showBotCount && <span className="shrink-0 tabular-nums" title={botCountLabel(selectedProjectId)}>{counts.get(selectedProjectId)?.toLocaleString('ru-RU') ?? '—'}</span>}
          </span></SelectValue>
        </SelectTrigger>
        <SelectContent className="users-portal project-selector-menu" align="start" collisionPadding={12}>
          {projects.map((project) => (
            <SelectItem
              key={project.id}
              value={String(project.id)}
              className="py-2 pr-3"
              textValue={project.name}
            >
              <span className="flex w-full min-w-0 items-center gap-3">
                <ProjectOptionLabel name={project.name} id={project.id} className="project-selector-option min-w-0 flex-1" />
                <span className="shrink-0 tabular-nums">{botCountLabel(project.id)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
