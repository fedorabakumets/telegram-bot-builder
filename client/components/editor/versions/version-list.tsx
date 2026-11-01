/**
 * @fileoverview История сохранений проекта с загрузкой, пустым результатом и доступными действиями.
 * @module editor/versions/version-list
 */
import { VersionRow } from './version-row';
import type { ProjectVersionMeta } from '@/hooks/use-project-versions';

/** Свойства списка истории проекта. */
export interface VersionListProps {
  /** Сохранённые версии. */
  versions: ProjectVersionMeta[];
  /** Идентификатор проекта для сравнения. */
  projectId?: number;
  /** Выполняется ли загрузка истории. */
  isLoading: boolean;
  /** Идентификатор восстанавливаемой версии. */
  restoringId: number | null;
  /** Обработчик восстановления. */
  onRestore: (versionId: number) => void;
}

/**
 * Показывает историю и сохраняет место под строки во время загрузки.
 * @param props - Версии, состояния загрузки и обработчик восстановления.
 * @returns Список версий либо пояснение отсутствия сохранений.
 */
export function VersionList({ versions, projectId, isLoading, restoringId, onRestore }: VersionListProps) {
  if (isLoading) return <div role="status" className="space-y-3">
    <span className="sr-only">Загрузка истории версий…</span>
    {[0, 1, 2].map((index) => <div key={index} className="versions-surface space-y-3 rounded-xl border p-4" aria-hidden="true">
      <div className="versions-inset h-4 w-32 rounded" /><div className="versions-inset h-3 w-48 max-w-full rounded" />
    </div>)}
  </div>;
  if (!versions.length) return <div className="versions-surface space-y-2 rounded-xl border border-dashed p-6">
    <h3 className="text-base font-semibold">Здесь появятся сохранённые версии</h3>
    <p className="text-pretty text-sm text-muted-foreground">Снимки создаются при сохранении проекта. Для важного этапа можно создать именованный чекпоинт выше.</p>
  </div>;
  return <div role="list" aria-label="Сохранённые версии" className="space-y-3">
    {versions.map((version, index) => <div key={version.id} role="listitem">
      <VersionRow version={version} projectId={projectId} versionNumber={versions.length - index} isLatest={index === 0}
        isRestoring={restoringId === version.id} restoreDisabled={restoringId !== null} onRestore={onRestore} />
    </div>)}
  </div>;
}
