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
