/**
 * @fileoverview Индикатор квоты хранилища `StorageQuotaBar`.
 * Полный и компактный (`compact`) варианты для toolbar и модалки.
 * @module components/editor/files/panel/storage-quota-bar
 */

import { HardDrive, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/utils/utils';
import { formatBytes } from './format-bytes';
import {
  PANEL_DENSE_SECTION_CLASS,
  QUOTA_CAPTION_MUTED_CLASS,
  QUOTA_CAPTION_PRIMARY_CLASS,
  QUOTA_COMPACT_CARD_CLASS,
  QUOTA_EXCEEDED_ICON_CLASS,
  QUOTA_EXCEEDED_TEXT_CLASS,
  QUOTA_FILL_CLASS,
  QUOTA_FILL_TRANSITION_CLASS,
  QUOTA_TRACK_CLASS,
  QUOTA_UNLIMITED_BADGE_CLASS,
  QUOTA_UNLIMITED_BADGE_ICON_CLASS,
  resolveQuotaLevel,
  type QuotaLevel,
} from './panel-styles';

/** Пропсы индикатора квоты */
export interface StorageQuotaBarProps {
  /** Занято байт */
  usedBytes: number;
  /** Лимит байт (null = безлимитно) */
  limitBytes: number | null;
  /** Состояние загрузки квоты */
  isLoading?: boolean;
  /** Компактная карточка для toolbar */
  compact?: boolean;
}

/**
 * Подпись состояния заполнения для текста индикатора.
 * @param level - Уровень заполнения
 * @param exceeded - Превышен ли лимит
 * @returns Человекочитаемая подпись
 */
function levelLabel(level: QuotaLevel, exceeded: boolean): string {
  if (exceeded) return 'Лимит превышен';
  if (level === 'critical') return 'Места почти не осталось';
  if (level === 'warn') return 'Места мало';
  return 'Места достаточно';
}

/**
 * Компактная карточка квоты для верхней панели.
 * @param props - Занятое место, лимит и состояние
 * @returns JSX компактного индикатора
 */
function CompactQuotaBar({
  usedBytes,
  limitBytes,
  isLoading,
}: StorageQuotaBarProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className={QUOTA_COMPACT_CARD_CLASS} data-testid="storage-quota-bar" data-state="loading">
        <div className={cn(QUOTA_TRACK_CLASS, 'h-1.5 animate-pulse')} />
      </div>
    );
  }

  if (limitBytes === null) {
    return (
      <div className={QUOTA_COMPACT_CARD_CLASS} data-testid="storage-quota-bar" data-state="unlimited">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <InfinityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Безлимитно
          </span>
          <span className="text-border/60">·</span>
          <span className={QUOTA_CAPTION_MUTED_CLASS}>{formatBytes(usedBytes)}</span>
        </div>
      </div>
    );
  }

  const exceeded = usedBytes > limitBytes;
  const percent = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;
  const level = resolveQuotaLevel(percent);
  const fillWidth = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={QUOTA_COMPACT_CARD_CLASS}
      data-testid="storage-quota-bar"
      data-state={exceeded ? 'exceeded' : level}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          {exceeded ? (
            <AlertTriangle className={QUOTA_EXCEEDED_ICON_CLASS} aria-hidden />
          ) : (
            <HardDrive className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className={QUOTA_CAPTION_PRIMARY_CLASS}>{Math.round(percent)}%</span>
          <span className={cn('truncate hidden sm:inline')}>{levelLabel(level, exceeded)}</span>
        </div>
        <span className="text-border/60 hidden sm:inline">·</span>
        <span className={cn(QUOTA_CAPTION_MUTED_CLASS, 'shrink-0 tabular-nums')}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>
      <div className={cn('h-1', QUOTA_TRACK_CLASS)}>
        <div
          className={cn(QUOTA_FILL_TRANSITION_CLASS, QUOTA_FILL_CLASS[level])}
          style={{ width: `${fillWidth}%` }}
          data-testid="storage-quota-fill"
        />
      </div>
    </div>
  );
}

/**
 * Индикатор квоты хранилища — прогресс-бар с текстом и цветовой индикацией.
 * @param props - Занятое место, лимит и состояние загрузки
 * @returns JSX элемент индикатора квоты
 */
export function StorageQuotaBar(props: StorageQuotaBarProps) {
  const { usedBytes, limitBytes, isLoading, compact } = props;

  if (compact) {
    return <CompactQuotaBar {...props} />;
  }

  if (isLoading) {
    return (
      <div
        className={PANEL_DENSE_SECTION_CLASS}
        data-testid="storage-quota-bar"
        data-state="loading"
      >
        <div className={cn(QUOTA_TRACK_CLASS, 'animate-pulse')} />
      </div>
    );
  }

  if (limitBytes === null) {
    return (
      <div
        className={cn('flex items-center gap-2 text-xs', PANEL_DENSE_SECTION_CLASS)}
        data-testid="storage-quota-bar"
        data-state="unlimited"
      >
        <span className={QUOTA_UNLIMITED_BADGE_CLASS}>
          <InfinityIcon className={QUOTA_UNLIMITED_BADGE_ICON_CLASS} aria-hidden />
          Безлимитно
        </span>
        <span className={QUOTA_CAPTION_MUTED_CLASS}>занято {formatBytes(usedBytes)}</span>
      </div>
    );
  }

  const exceeded = usedBytes > limitBytes;
  const percent = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;
  const level = resolveQuotaLevel(percent);
  const fillWidth = Math.min(100, Math.max(0, percent));
  const percentLabel = `${Math.round(percent)}%`;

  return (
    <div
      className={PANEL_DENSE_SECTION_CLASS}
      data-testid="storage-quota-bar"
      data-state={exceeded ? 'exceeded' : level}
    >
      <div className="flex items-center gap-2 text-xs">
        {exceeded ? (
          <AlertTriangle className={QUOTA_EXCEEDED_ICON_CLASS} aria-hidden />
        ) : (
          <HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className={QUOTA_CAPTION_PRIMARY_CLASS}>{percentLabel}</span>
        <span className={QUOTA_CAPTION_MUTED_CLASS}>— {levelLabel(level, exceeded)} —</span>
        <span className={QUOTA_CAPTION_MUTED_CLASS}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>

      <div className={cn('mt-1.5', QUOTA_TRACK_CLASS)}>
        <div
          className={cn(QUOTA_FILL_TRANSITION_CLASS, QUOTA_FILL_CLASS[level])}
          style={{ width: `${fillWidth}%` }}
          data-testid="storage-quota-fill"
        />
      </div>

      {exceeded && (
        <p className={QUOTA_EXCEEDED_TEXT_CLASS} data-testid="storage-quota-warning">
          Хранилище переполнено. Загрузка остаётся доступной, но освободите место.
        </p>
      )}
    </div>
  );
}
