/**
 * @fileoverview Индикатор квоты хранилища `StorageQuotaBar`.
 * Показывает прогресс-бар и текст в стиле «3% — Места достаточно —
 * 37.56 Kb / 1 Gb» (Req 4.1). Цвета и пороги (success < 70%, warning 70–90%,
 * destructive > 90%) берутся из единого helper'а `panel-styles` (Req 4.6 —
 * пороги синхронны с сервером compute-quota-warning). Ширина и цвет
 * заливки анимируются плавно через CSS-transition (Req 13.1). При безлимите
 * (limitBytes === null) — аккуратный бейдж «Безлимитно» с иконкой Infinity,
 * без процента и заполнения, рядом — приглушённая подпись с занятым объёмом
 * (Req 4.3). При превышении лимита — `destructive`-индикатор и
 * предупреждающая подпись, без жёсткой блокировки (Req 4.8). Все цифры
 * выводятся моноширинными (`tabular-nums`) — основная цифра в `text-foreground`
 * с плотным трекингом, вторичная — в `text-muted-foreground`.
 * @module components/editor/files/panel/storage-quota-bar
 */

import { HardDrive, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/utils/utils';
import { formatBytes } from './format-bytes';
import {
  PANEL_DENSE_SECTION_CLASS,
  QUOTA_CAPTION_MUTED_CLASS,
  QUOTA_CAPTION_PRIMARY_CLASS,
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
 * Индикатор квоты хранилища — прогресс-бар с текстом и цветовой индикацией.
 * @param props - Занятое место, лимит и состояние загрузки
 * @returns JSX элемент индикатора квоты
 */
export function StorageQuotaBar({ usedBytes, limitBytes, isLoading }: StorageQuotaBarProps) {
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

  // Безлимитный режим (Req 4.3): без процента и без заполнения полосы.
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
