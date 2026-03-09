/**
 * @fileoverview Компонент кнопок действий QR (назад и обновление)
 *
 * @module QrActionButtons
 */

import { Button } from '@/components/ui/button';

/**
 * Пропсы компонента кнопок
 */
export interface QrActionButtonsProps {
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик возврата назад */
  onBack: () => void;
  /** Обработчик обновления QR */
  onRefresh: () => void;
}

/**
 * Кнопки действий QR
 *
 * @param {QrActionButtonsProps} props - Пропсы компонента
 * @returns {JSX.Element} Кнопки назад и обновления
 *
 * @example
 * ```tsx
 * <QrActionButtons
 *   isLoading={false}
 *   onBack={handleBack}
 *   onRefresh={handleRefresh}
 * />
 * ```
 */
export function QrActionButtons({
  isLoading,
  onBack,
  onRefresh,
}: QrActionButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isLoading}
        className="flex-1"
      >
        Назад
      </Button>
      <Button
        onClick={onRefresh}
        disabled={isLoading}
        variant="outline"
        className="flex-1"
      >
        Обновить QR
      </Button>
    </div>
  );
}
