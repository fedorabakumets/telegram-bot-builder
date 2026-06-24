/**
 * @fileoverview Строка одной версии проекта в списке истории
 * @module editor/versions/version-row
 */

import { useState } from 'react';
import { History, GitCommit, RotateCcw, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectVersionMeta } from '@/hooks/use-project-versions';
import { VersionDiffSummary } from './version-diff-summary';

/** Пропсы строки версии */
export interface VersionRowProps {
  /** Метаданные версии */
  version: ProjectVersionMeta;
  /** ID проекта (нужен для сравнения с текущим состоянием) */
  projectId?: number;
  /** Номер версии для отображения (чем больше — тем новее) */
  versionNumber?: number;
  /** Является ли версия самой свежей (последнее сохранение) */
  isLatest?: boolean;
  /** Идёт ли восстановление этой версии */
  isRestoring: boolean;
  /** Компактный режим — кнопка только с иконкой (для узкого попапа тулбара) */
  compact?: boolean;
  /** Обработчик восстановления версии */
  onRestore: (versionId: number) => void;
}

/**
 * Форматирует дату создания версии: «сегодня · ЧЧ:ММ», «вчера · ЧЧ:ММ»
 * или полную дату со временем для более старых версий.
 * @param value - Значение даты (строка или Date)
 * @returns Человекочитаемая строка времени
 */
function formatRelative(value: ProjectVersionMeta['createdAt']): string {
  if (!value) return '—';
  const date = new Date(value);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (dayDiff === 0) return `сегодня · ${time}`;
  if (dayDiff === 1) return `вчера · ${time}`;
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Строка одной версии проекта
 * @param props - Свойства компонента
 * @returns JSX элемент строки версии
 */
export function VersionRow({ version, projectId, versionNumber, isLatest, isRestoring, compact, onRestore }: VersionRowProps) {
  const [showDiff, setShowDiff] = useState(false);
  const isManual = version.kind === 'manual';
  const isNumbered = versionNumber != null && !isManual;
  // Для ручного коммита заголовок — сообщение (label); для авто — «Версия N»
  const title = isManual ? (version.label || 'Чекпоинт') : (isNumbered ? `Версия ${versionNumber}` : (version.label || 'Версия'));

  return (
    <div className="border-b">
      <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`rounded-md p-2 shrink-0 ${isManual ? 'bg-amber-500/15' : 'bg-primary/10'}`}>
            {isManual
              ? <GitCommit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              : <History className="h-4 w-4 text-primary" />}
          </div>
          <div className="min-w-0">
            {/* Название занимает всю первую строку — бейджи перенесены ниже.
                Длинное сообщение ручного чекпоинта переносится на 2 строки. */}
            <div
              className={`text-sm font-medium ${isNumbered ? 'whitespace-nowrap' : 'line-clamp-2 break-words'}`}
              title={title}
            >
              {title}
            </div>
            {/* Бейджи и время в одной строке с переносом — время не обрезается,
                а уезжает на следующую строку, если не помещается рядом с бейджами */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
              {isManual && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 whitespace-nowrap">
                  чекпоинт
                </span>
              )}
              {isLatest && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                  последняя
                </span>
              )}
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {formatRelative(version.createdAt)}
              </span>
              {version.authorName && (
                <span className="text-xs text-muted-foreground opacity-70 truncate">
                  · {version.authorName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {projectId != null && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowDiff((v) => !v)}
              title="Сравнить с текущим"
            >
              <GitCompare className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="outline"
            size={compact ? 'icon' : 'sm'}
            className={compact ? 'h-8 w-8' : ''}
            disabled={isRestoring}
            onClick={() => onRestore(version.id)}
            title={compact ? 'Восстановить' : undefined}
          >
            <RotateCcw className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 mr-1.5'} />
            {!compact && (isRestoring ? 'Откат…' : 'Восстановить')}
          </Button>
        </div>
      </div>
      {showDiff && projectId != null && (
        <div className="bg-muted/30">
          <VersionDiffSummary projectId={projectId} versionId={version.id} />
        </div>
      )}
    </div>
  );
}
