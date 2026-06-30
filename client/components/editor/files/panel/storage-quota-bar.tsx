/**
 * @fileoverview Индикатор квоты хранилища `StorageQuotaBar`.
 * Показывает прогресс-бар и текст в стиле «3% — Места достаточно —
 * 37.56 Kb / 1 Gb» (Req 4.1). Цвет полосы: зелёный < 70%, жёлтый 70–90%,
 * красный > 90% (Req 4.6, пороги совпадают с server/compute-quota-warning).
 * При безлимите (limitBytes === null) — аккуратный блок «Безлимитно» без
 * процента и заполнения (Req 4.3). При превышении лимита — красный
 * индикатор и предупреждающая подпись, без жёсткой блокировки (Req 4.8).
 * @module components/editor/files/panel/storage-quota-bar
 */

import { HardDrive, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/utils/utils';
import { formatBytes } from './format-bytes';

/** Порог перехода к жёлтому уровню (warn), в процентах (синхронно с сервером) */
const QUOTA_WARN_PERCENT = 70;

/** Порог перехода к красному уровню (critical), в процентах (синхронно с сервером) */
const QUOTA_CRITICAL_PERCENT = 90;

/** Пропсы индикатора квоты */
export interface StorageQuotaBarProps {
  /** Занято байт */
  usedBytes: number;
  /** Лимит байт (null = безлимитно) */
  limitBytes: number | null;
  /** Состояние загрузки квоты */
  isLoading?: boolean;
}

/** Уровень заполнения для выбора цвета полосы */
type QuotaLevel = 'ok' | 'warn' | 'critical';

/** CSS-классы заливки полосы по уровню заполнения */
const FILL_CLASS: Record<QuotaLevel, string> = {
  ok: 'bg-green-500',
  warn: 'bg-yellow-500',
  critical: 'bg-red-500',
};

/**
 * Определяет уровень-индикатор по проценту заполнения (Req 4.6).
 * @param percent - Процент заполнения квоты
 * @returns Уровень: `ok` (<70%), `warn` (70–90%), `critical` (>90%)
 */
function resolveLevel(percent: number): QuotaLevel {
  if (percent > QUOTA_CRITICAL_PERCENT) return 'critical';
  if (percent >= QUOTA_WARN_PERCENT) return 'warn';
  return 'ok';
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
      <div className="px-4 py-2.5 border-b" data-testid="storage-quota-bar" data-state="loading">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // Безлимитный режим (Req 4.3): без процента и без заполнения полосы.
  if (limitBytes === null) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b text-sm text-muted-foreground"
        data-testid="storage-quota-bar"
        data-state="unlimited"
      >
        <InfinityIcon className="h-4 w-4 shrink-0" />
        <span className="font-medium text-foreground">Безлимитно</span>
        <span className="text-muted-foreground">— занято {formatBytes(usedBytes)}</span>
      </div>
    );
  }

  const exceeded = usedBytes > limitBytes;
  const percent = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;
  const level = resolveLevel(percent);
  const fillWidth = Math.min(100, Math.max(0, percent));
  const percentLabel = `${Math.round(percent)}%`;

  return (
    <div
      className="px-4 py-2.5 border-b"
      data-testid="storage-quota-bar"
      data-state={exceeded ? 'exceeded' : level}
    >
      <div className="flex items-center gap-2 text-xs">
        {exceeded ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
        ) : (
          <HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium text-foreground">{percentLabel}</span>
        <span className="text-muted-foreground">— {levelLabel(level, exceeded)} —</span>
        <span className="text-muted-foreground">
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>

      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', FILL_CLASS[level])}
          style={{ width: `${fillWidth}%` }}
          data-testid="storage-quota-fill"
        />
      </div>

      {exceeded && (
        <p className="mt-1 text-xs text-red-500" data-testid="storage-quota-warning">
          Хранилище переполнено. Загрузка остаётся доступной, но освободите место.
        </p>
      )}
    </div>
  );
}
