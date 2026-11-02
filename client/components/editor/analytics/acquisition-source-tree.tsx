/** @fileoverview Единый компактный список рекламных источников без отдельного уровня размещений. */
import type { AcquisitionCatalog } from './acquisition-types';
/** Показывает каждый источник один раз без действий переименования и архивирования. */
export function AcquisitionSourceTree({ projectId, catalog, }: {
  /** Проект. */ projectId: number;
  /** Каталог источников. */ catalog: AcquisitionCatalog;
  /** Открыть переименование. */ onEdit?: (id: number) => void;
}) {
  return <details className="space-y-3" open><summary className="cursor-pointer text-lg font-semibold">Источники</summary>
    {!catalog.sources.length ? <p className="text-sm text-muted-foreground">Нет источников по выбранным условиям.</p>
      : <ul className="analytics-placement-list">{catalog.sources.map(source => <li key={source.id} className="analytics-placement-row">
        <span className="min-w-0 break-words font-medium">{source.name}{source.archivedAt ? ' · в архиве' : ''}</span>
      </li>)}</ul>}
  </details>;
}
