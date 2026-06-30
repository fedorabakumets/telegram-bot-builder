/**
 * @fileoverview Расчёт мягкого предупреждения о заполнении квоты хранилища.
 *
 * Возвращает состояние без блокировки загрузки (Req 4.7): процент заполнения и
 * уровень-индикатор для цвета полосы прогресса (Req 4.6): `ok` при заполнении
 * < 70%, `warn` при 70–90%, `critical` при > 90%. При безлимитном режиме
 * (`limitBytes = null`) процент нулевой, уровень `ok`, флаг превышения снят
 * (Req 4.5). Флаг `quotaExceeded` поднимается только при заданном лимите,
 * когда использовано больше лимита.
 * @module server/storage/compute-quota-warning
 */

import { isQuotaExceeded } from "./compute-quota";

/** Уровень заполнения квоты для индикатора (цвет полосы) */
export type QuotaWarningLevel = "ok" | "warn" | "critical";

/** Порог перехода к жёлтому уровню (warn), в процентах */
export const QUOTA_WARN_PERCENT = 70;

/** Порог перехода к красному уровню (critical), в процентах */
export const QUOTA_CRITICAL_PERCENT = 90;

/** Мягкое предупреждение о заполнении квоты (без блокировки) */
export interface QuotaWarning {
  /** Превышена ли квота (false при безлимите) */
  quotaExceeded: boolean;
  /** Процент заполнения (0 при безлимите); может быть > 100 при превышении */
  percent: number;
  /** Уровень для цвета индикатора: ok / warn / critical */
  level: QuotaWarningLevel;
}

/**
 * Определяет уровень-индикатор по проценту заполнения (Req 4.6).
 * @param percent - Процент заполнения квоты
 * @returns Уровень: `ok` (<70%), `warn` (70–90%), `critical` (>90%)
 */
function resolveLevel(percent: number): QuotaWarningLevel {
  if (percent > QUOTA_CRITICAL_PERCENT) {
    return "critical";
  }
  if (percent >= QUOTA_WARN_PERCENT) {
    return "warn";
  }
  return "ok";
}

/**
 * Вычисляет мягкое предупреждение о заполнении квоты без блокировки загрузки.
 *
 * При безлимите (`limitBytes = null`) возвращает нейтральное состояние
 * (`percent = 0`, `level = 'ok'`, `quotaExceeded = false`). При нулевом лимите
 * процент не вычисляется во избежание деления на ноль — состояние нейтральное.
 * @param usedBytes - Использовано байт
 * @param limitBytes - Лимит в байтах либо null для безлимитного режима
 * @returns Объект `{ quotaExceeded, percent, level }`
 */
export function computeQuotaWarning(
  usedBytes: number,
  limitBytes: number | null,
): QuotaWarning {
  if (limitBytes === null || limitBytes <= 0) {
    return { quotaExceeded: false, percent: 0, level: "ok" };
  }
  const percent = (usedBytes / limitBytes) * 100;
  return {
    quotaExceeded: isQuotaExceeded(usedBytes, limitBytes),
    percent,
    level: resolveLevel(percent),
  };
}
