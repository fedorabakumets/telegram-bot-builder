/**
 * @fileoverview Карточка запуска бота в стиле Railway Deployments
 * @module bot/card/BotLaunchCard
 */

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BotLaunchHistory } from '@shared/schema';
import {
  formatLaunchDurationLabel,
  formatRelativeRu,
  getLaunchStatusMeta,
} from './launch-history-utils';

/** Пропсы карточки запуска */
interface BotLaunchCardProps {
  /** Запись истории */
  record: BotLaunchHistory;
  /** Открыть логи */
  onShowLogs: (id: number, startedAt: Date | string | null) => void;
  /** Крупная карточка текущего запуска */
  featured?: boolean;
  /** Строка внутри общего списка (без своей рамки) */
  embedded?: boolean;
}

/**
 * Карточка одного запуска: статус, время, кнопка логов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLaunchCard({
  record,
  onShowLogs,
  featured = false,
  embedded = false,
}: BotLaunchCardProps) {
  const meta = getLaunchStatusMeta(record.status, record.errorMessage);
  const duration = formatLaunchDurationLabel(record.startedAt, record.stoppedAt);
  const isRunning = record.status === 'running';
  const isError = record.status === 'error';

  return (
    <div
      className={[
        embedded
          ? 'bg-transparent'
          : [
              'rounded-lg border bg-card transition-colors',
              featured ? 'border-border shadow-sm' : 'border-border/50 hover:border-border',
            ].join(' '),
      ].join(' ')}
    >
      <div className={['flex items-center gap-3', featured ? 'p-3.5' : 'px-3.5 py-2.5'].join(' ')}>
        <span
          className={[
            'h-2 w-2 shrink-0 rounded-full',
            isRunning ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-muted-foreground/40',
          ].join(' ')}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'inline-flex items-center rounded-md border px-1.5 py-0.5',
                'text-[10px] font-semibold uppercase tracking-wide',
                meta.badgeClass,
              ].join(' ')}
            >
              {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeRu(record.startedAt)}
              {duration ? ` · ${duration}` : ''}
            </span>
          </div>
          {featured && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{meta.footer}</p>
          )}
          {!featured && isError && record.errorMessage && (
            <p className="mt-0.5 truncate text-[11px] text-red-400/90">{record.errorMessage}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onShowLogs(record.id, record.startedAt)}
        >
          <FileText className="h-3.5 w-3.5" />
          Логи
        </Button>
      </div>
    </div>
  );
}
