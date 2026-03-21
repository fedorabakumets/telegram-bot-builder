/**
 * @fileoverview Выбор проекта для добавления бота
 *
 * Компонент отображает выпадающий список для выбора проекта.
 *
 * @module AddBotProjectSelect
 */

import { Label } from '@/components/ui/label';

interface AddBotProjectSelectProps {
  projects: any[];
  projectForNewBot: number | null;
  setProjectForNewBot: (projectId: number | null) => void;
}

/**
 * Выбор проекта для добавления бота
 */
export function AddBotProjectSelect({
  projects,
  projectForNewBot,
  setProjectForNewBot
}: AddBotProjectSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="project-select" className="text-sm sm:text-base font-semibold">
        Выберите проект
      </Label>
      <select
        id="project-select"
        value={projectForNewBot || ''}
        onChange={(e) => setProjectForNewBot(Number(e.target.value))}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Выберите проект...</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
