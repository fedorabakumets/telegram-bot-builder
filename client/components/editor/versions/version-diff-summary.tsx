/**
 * @fileoverview Компактная сводка diff версии относительно текущего состояния
 *
 * Догружает полный снимок версии и сравнивает его ноды с текущими данными
 * проекта из кэша. Показывает «+N нод, −M нод, ~K изменено».
 *
 * @module editor/versions/version-diff-summary
 */

import { useQueryClient } from '@tanstack/react-query';
import { useProjectVersionSnapshot } from '@/hooks/use-project-versions';
import { diffNodes } from './version-diff';

/** Пропсы сводки diff */
export interface VersionDiffSummaryProps {
  /** ID проекта */
  projectId: number;
  /** ID версии для сравнения */
  versionId: number;
}

/**
 * Компактная сводка различий версии и текущего состояния проекта
 * @param props - Свойства компонента
 * @returns JSX элемент сводки diff
 */
export function VersionDiffSummary({ projectId, versionId }: VersionDiffSummaryProps) {
  const queryClient = useQueryClient();
  const { data: version, isLoading, isError } = useProjectVersionSnapshot(projectId, versionId);

  if (isLoading) {
    return <div className="px-4 py-2 text-xs text-muted-foreground">Загрузка снимка…</div>;
  }
  if (isError || !version) {
    return <div className="px-4 py-2 text-xs text-destructive">Не удалось загрузить снимок версии</div>;
  }

  // Текущее состояние проекта берём из кэша запроса проекта
  const current = queryClient.getQueryData<{ data?: unknown }>([`/api/projects/${projectId}`]);
  const diff = diffNodes((version as { snapshot?: unknown }).snapshot, current?.data);

  return (
    <div className="px-4 py-2 text-xs flex items-center gap-3">
      <span className="text-emerald-600 dark:text-emerald-400">+{diff.added.length} нод</span>
      <span className="text-red-600 dark:text-red-400">−{diff.removed.length} нод</span>
      <span className="text-amber-600 dark:text-amber-400">~{diff.changed.length} изменено</span>
      {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
        <span className="text-muted-foreground">Изменений нет</span>
      )}
    </div>
  );
}
