/**
 * @fileoverview Компонент индикатора обратного отсчёта QR-кода
 *
 * Отображает таймер до обновления QR-токена.
 *
 * @module QrCountdownBadge
 */

/**
 * Пропсы компонента таймера
 */
export interface QrCountdownBadgeProps {
  /** Оставшееся время в секундах */
  countdown: number;
}

/**
 * Индикатор обратного отсчёта QR-кода
 *
 * @param {QrCountdownBadgeProps} props - Пропсы компонента
 * @returns {JSX.Element} Бейдж с таймером
 *
 * @example
 * ```tsx
 * <QrCountdownBadge countdown={30} />
 * ```
 */
export function QrCountdownBadge({ countdown }: QrCountdownBadgeProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
      <span className="animate-pulse">🔄</span>
      <span>{countdown}с</span>
    </div>
  );
}
