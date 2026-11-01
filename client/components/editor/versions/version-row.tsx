/**
 * @fileoverview Карточка сохранённой версии с метаданными, сравнением и восстановлением.
 * @module editor/versions/version-row
 */
import { useState } from 'react';
import { History, GitCommit, RotateCcw, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectVersionMeta } from '@/hooks/use-project-versions';
import { VersionDiffSummary } from './version-diff-summary';

/** Свойства карточки сохранения. */
export interface VersionRowProps {
  /** Метаданные сохранения. */
  version: ProjectVersionMeta;
  /** Проект для сравнения с текущим состоянием. */
  projectId?: number;
  /** Порядковый номер версии в истории. */
  versionNumber?: number;
  /** Последнее сохранение в списке. */
  isLatest?: boolean;
  /** Выполняется ли восстановление этой версии. */
  isRestoring: boolean;
  /** Запрет повторного восстановления, пока другой запрос выполняется. */
  restoreDisabled?: boolean;
  /** Компактное отображение во всплывающем списке. */
  compact?: boolean;
  /** Обработчик восстановления сохранения. */
  onRestore: (versionId: number) => void;
}

/**
 * Форматирует дату сохранения относительно текущего дня пользователя.
 * @param value - Дата из метаданных сохранения.
 * @returns Локализованное время либо полная дата.
 */
function formatRelative(value: ProjectVersionMeta['createdAt']): string {
  if (!value) return 'Дата не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата не указана';
  const now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (days === 0) return `Сегодня, ${time}`;
  if (days === 1) return `Вчера, ${time}`;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Показывает сохранение с раскрываемым сравнением и действием восстановления.
 * @param props - Данные версии и обработчик восстановления.
 * @returns Карточка версии или её компактный вариант.
 */
export function VersionRow({ version, projectId, versionNumber, isLatest, isRestoring, restoreDisabled, compact, onRestore }: VersionRowProps) {
  const [showDiff, setShowDiff] = useState(false);
  const manual = version.kind === 'manual';
  const createdAt = version.createdAt ? new Date(version.createdAt) : null;
  const title = manual ? (version.label || 'Чекпоинт') : (versionNumber != null ? `Версия ${versionNumber}` : version.label || 'Версия');
  return (
    <article className={compact ? 'border-b border-border' : 'versions-surface version-entry rounded-xl border p-4'}>
      <div className={compact ? 'flex items-center justify-between gap-3 px-4 py-3' : 'version-row grid items-start gap-3'}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="versions-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
            {manual ? <GitCommit className="h-4 w-4" aria-hidden="true" /> : <History className="h-4 w-4" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="min-w-0 break-words text-sm font-semibold" title={title}>{title}</h4>
              {isLatest && <span className="versions-inset shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground">Последняя</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{manual ? 'Чекпоинт' : 'Автосохранение'}</span>
              <time dateTime={createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : undefined}>{formatRelative(version.createdAt)}</time>
            </div>
            {version.authorName && <p className="break-words text-xs text-muted-foreground" title={version.authorName}>{version.authorName}</p>}
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${compact ? 'shrink-0' : 'version-actions'}`}>
          {projectId != null && <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="versions-action h-8 px-3 text-xs"
            onClick={() => setShowDiff((value) => !value)} aria-expanded={showDiff} aria-label={`Сравнить: ${title}`} title="Сравнить с текущим состоянием">
            <GitCompare className="h-4 w-4" aria-hidden="true" />{!compact && 'Сравнить'}
          </Button>}
          <Button variant="outline" size={compact ? 'icon' : 'sm'} className="versions-action h-8 px-3 text-xs"
            disabled={isRestoring || restoreDisabled} onClick={() => onRestore(version.id)} aria-label={`Восстановить: ${title}`} title="Восстановить версию">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{!compact && (isRestoring ? 'Восстановление…' : 'Восстановить')}
          </Button>
        </div>
      </div>
      {showDiff && projectId != null && <div className="versions-inset version-diff mt-3 rounded-lg p-1" role="region" aria-label={`Сравнение: ${title}`}>
        <VersionDiffSummary projectId={projectId} versionId={version.id} />
      </div>}
    </article>
  );
}
