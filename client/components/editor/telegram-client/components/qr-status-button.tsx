/**
 * @fileoverview Компонент кнопки проверки статуса QR
 *
 * @module QrStatusButton
 */

import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Пропсы компонента кнопки
 */
export interface QrStatusButtonProps {
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик нажатия */
  onClick: () => void;
}

/**
 * Кнопка проверки статуса QR
 *
 * @param {QrStatusButtonProps} props - Пропсы компонента
 * @returns {JSX.Element} Кнопка с состоянием
 *
 * @example
 * ```tsx
 * <QrStatusButton isLoading={false} onClick={handleCheck} />
 * ```
 */
export function QrStatusButton({ isLoading, onClick }: QrStatusButtonProps) {
  return (
    <div className="text-center">
      <Button
        onClick={onClick}
        disabled={isLoading}
        className="w-full gap-2"
        variant="default"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Проверяем...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Я отсканировал QR-код
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Нажмите после сканирования для проверки
      </p>
    </div>
  );
}
