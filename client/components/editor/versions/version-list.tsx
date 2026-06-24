/**
 * @fileoverview Список версий проекта с состояниями загрузки и пустого результата
 * @module editor/versions/version-list
 */

import { VersionRow } from './version-row';
import type { ProjectVersionMeta } from '@/hooks/use-project-versions';

/** Пропсы списка версий */
export interface VersionListProps {
  /** Список версий */
  versions: ProjectVersionMeta[];
  /** ID проекта (для сравнения версии с текущим состоянием) */
  projectId?: number;
  /** Идёт ли загрузка списка */
  isLoading: boolean;
  /** ID версии, которая сейчас восстанавливается */
  restoringId: number | null;
  /** Обработчик восстановления версии */
  onRestore: (versionId: number) => void;
}

/**
 * Список версий проекта
 * @param props - Свойства компонента
 * @returns JSX элемент списка версий
 */
export function VersionList({ versions, projectId, isLoading, restoringId, onRestore }: VersionListProps) {
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка истории версий…</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        История версий пуста. Снимки создаются автоматически при сохранении проекта.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {versions.map((version, index) => (
        <VersionRow
          key={version.id}
          version={version}
          projectId={projectId}
          versionNumber={versions.length - index}
          isLatest={index === 0}
          isRestoring={restoringId === version.id}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
