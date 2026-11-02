/**
 * @fileoverview Прогресс и итог массовой проверки доступов.
 * @module client/components/editor/analytics/analytics-access-check-progress
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { isActiveChatAccessCheckStatus, type ChatAccessCheckStatus } from '@shared/project-sync/project-event';

/** Через сколько мс скрывать завершённый итог. */
const AUTO_HIDE_MS = 5000;
/** Длительность анимации исчезновения. */
const EXIT_MS = 300;

/**
 * Пропсы прогресса проверки.
 */
interface AnalyticsAccessCheckProgressProps {
  /** Текущий статус. */
  status: ChatAccessCheckStatus;
  /** Уже проверено. */
  processedCount: number;
  /** Всего в очереди. */
  totalCount: number;
  /** Доступны. */
  availableCount: number;
  /** Заблокировали. */
  kickedCount: number;
  /** Аккаунт удалён. */
  deletedCount: number;
  /** Ошибки. */
  errorCount: number;
  /** Отмена оставшейся очереди. */
  onCancel?: () => void;
  /** Запрос отмены уже отправлен. */
  cancelling?: boolean;
  /** Скрыть итог завершённой проверки. */
  onDismiss?: () => void;
}

/**
 * Показывает читаемый прогресс проверки и доступные действия отмены и закрытия.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnalyticsAccessCheckProgress(props: AnalyticsAccessCheckProgressProps) {
  const {
    status, processedCount, totalCount, availableCount, kickedCount, deletedCount, errorCount,
    onCancel, cancelling, onDismiss,
  } = props;
  const pct = totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : 0;
  const active = isActiveChatAccessCheckStatus(status);
  const [leaving, setLeaving] = useState(false);
  const title = status === 'cancelling'
    ? 'Останавливаем проверку…'
    : status === 'cancelled'
      ? `Остановлено: ${processedCount} из ${totalCount}`
      : status === 'failed'
        ? 'Проверка прервана'
        : status === 'completed'
          ? 'Проверка завершена'
          : `Проверено ${processedCount} из ${totalCount}`;

  useEffect(() => {
    if (active || !onDismiss) {
      setLeaving(false);
      return undefined;
    }
    setLeaving(false);
    const timer = window.setTimeout(() => setLeaving(true), AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, onDismiss, status]);

  useEffect(() => {
    if (!leaving || !onDismiss) return undefined;
    const timer = window.setTimeout(onDismiss, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, onDismiss]);

  return (
    <div
      className={[
        'space-y-3 rounded-lg border border-border bg-background p-4',
        'transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        leaving ? 'pointer-events-none motion-safe:-translate-y-1 opacity-0' : 'translate-y-0 scale-100 opacity-100',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm text-foreground">{title}</p>
        {active && onCancel && (
          <Button type="button" size="sm" variant="ghost" className="h-8 shrink-0 px-3 text-sm" disabled={cancelling || status === 'cancelling'} onClick={onCancel}>
            Отменить
          </Button>
        )}
        {!active && onDismiss && (
          <Button type="button" size="sm" variant="ghost" className="h-8 w-8 shrink-0 p-0 text-muted-foreground" aria-label="Закрыть итог" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Progress value={pct} aria-label="Прогресс проверки доступов" className="h-2 bg-muted" />
      <p className="flex flex-wrap gap-3 text-xs tabular-nums">
        <span className="text-emerald-600 dark:text-emerald-400">Доступны: {availableCount}</span>
        <span className="text-amber-600 dark:text-amber-400">Заблокировали: {kickedCount}</span>
        <span className="text-orange-600 dark:text-orange-400">Аккаунт удалён: {deletedCount}</span>
        <span className="text-red-600 dark:text-red-400">Ошибки: {errorCount}</span>
      </p>
    </div>
  );
}
