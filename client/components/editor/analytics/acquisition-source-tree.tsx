/** @fileoverview Единый компактный список рекламных источников без отдельного уровня размещений. */
import { Button } from '@/components/ui/button';
import type { AcquisitionCatalog } from './acquisition-types';
import { AcquisitionResourceActions } from './acquisition-resource-actions';
/** Показывает каждый источник один раз с переименованием и архивированием. */
export function AcquisitionSourceTree({ projectId, catalog, onEdit }: {
  /** Проект. */ projectId: number;
  /** Каталог источников. */ catalog: AcquisitionCatalog;
  /** Открыть переименование. */ onEdit: (id: number) => void;
}) {
  return <details className="space-y-3" open><summary className="cursor-pointer text-lg font-semibold">Источники</summary>
    {!catalog.sources.length ? <p className="text-sm text-muted-foreground">Источники появятся после сохранения рекламного бюджета или первого перехода по ссылке.</p>
      : <ul className="analytics-placement-list">{catalog.sources.map(source => <li key={source.id} className="analytics-placement-row">
        <span className="min-w-0 break-words font-medium">{source.name}{source.archivedAt ? ' · в архиве' : ''}</span>
        <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => onEdit(source.id)}>Изменить название</Button><AcquisitionResourceActions projectId={projectId} resource="sources" id={source.id} archived={!!source.archivedAt} /></div>
      </li>)}</ul>}
  </details>;
}
