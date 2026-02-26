/**
 * @fileoverview Компонент информации о последнем экспорте
 * @description Отображает ссылку на последнюю экспортированную Google Таблицу
 */

import { BotProject } from '@shared/schema';

/**
 * Пропсы компонента ExportInfo
 */
interface ExportInfoProps {
  /** Данные проекта */
  project: BotProject | null;
}

/**
 * Компонент информации об экспорте
 * @param props - Пропсы компонента
 * @returns JSX компонент или null
 */
export function ExportInfo({ project }: ExportInfoProps): React.JSX.Element | null {
  if (!project?.lastExportedGoogleSheetUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
      <span className="text-green-600 dark:text-green-400">📊</span>
      <span className="text-muted-foreground">Последний экспорт:</span>
      <a
        href={project.lastExportedGoogleSheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 dark:text-green-400 hover:underline font-medium"
      >
        Открыть Google Таблицу
      </a>
      {project.lastExportedAt && (
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(project.lastExportedAt).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );
}
