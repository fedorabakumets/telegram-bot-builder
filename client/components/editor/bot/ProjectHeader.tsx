/**
 * @fileoverview Заголовок проекта
 *
 * Компонент отображает название проекта и количество ботов.
 *
 * @module ProjectHeader
 */

interface ProjectHeaderProps {
  projectName: string;
  botsCount: number;
}

/**
 * Заголовок проекта
 */
export function ProjectHeader({ projectName, botsCount }: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-foreground">{projectName}</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Ботов: {botsCount}
        </span>
      </div>
    </div>
  );
}
