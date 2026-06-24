/**
 * @fileoverview Бейдж последнего удалённого обновления холста (коллаборатор / агент)
 * @module components/editor/staging/remote-sync-badge
 */

import type { CanvasActor } from '@shared/canvas-sync/canvas-actor';
import { formatCanvasActorLabel } from '@shared/canvas-sync/canvas-actor';

/** Свойства бейджа удалённой синхронизации */
export interface RemoteSyncBadgeProps {
  /** Актор, внёсший последние изменения */
  actor: CanvasActor;
  /** Колбэк закрытия бейджа */
  onDismiss?: () => void;
}

/**
 * Формирует текст статуса по типу актора
 * @param actor - Актор изменения
 * @returns Текст для бейджа
 */
function remoteSyncStatusText(actor: CanvasActor): string {
  const label = formatCanvasActorLabel(actor);
  if (actor.kind === 'agent') return `${label} редактирует холст`;
  if (actor.kind === 'guest') return `${label} обновил холст`;
  return `${label} обновил холст`;
}

/**
 * Бейдж «кто изменил холст» в StagingBar
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RemoteSyncBadge({ actor, onDismiss }: RemoteSyncBadgeProps) {
  const isAgent = actor.kind === 'agent';
  const iconClass = isAgent ? 'fa-robot text-sky-500 dark:text-sky-400' : 'fa-user text-blue-500 dark:text-blue-400';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/60 whitespace-nowrap max-w-[min(100%,280px)]">
      <i className={`fas ${iconClass} shrink-0`} />
      <span className="truncate">{remoteSyncStatusText(actor)}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 ml-0.5 opacity-60 hover:opacity-100"
          aria-label="Скрыть"
        >
          <i className="fas fa-times text-[10px]" />
        </button>
      )}
    </span>
  );
}
