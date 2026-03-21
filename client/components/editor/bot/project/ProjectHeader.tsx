/**
 * @fileoverview Заголовок проекта в панели ботов
 *
 * Отображает название проекта (font-semibold, text-foreground)
 * и счётчик ботов (text-muted-foreground, text-sm).
 *
 * @module ProjectHeader
 */

/** Свойства заголовка проекта */
interface ProjectHeaderProps {
  /** Название проекта */
  projectName: string;
  /** Количество ботов в проекте */
  botsCount: number;
}

/**
 * Заголовок проекта
 */
export function ProjectHeader({ projectName, botsCount }: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-lg sm:text-xl font-semibold text-foreground truncate min-w-0">
        {projectName}
      </h3>
      <span className="text-sm text-muted-foreground flex-shrink-0">
        Ботов: {botsCount}
      </span>
    </div>
  );
}
