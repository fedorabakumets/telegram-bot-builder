/**
 * @fileoverview Компонент заголовка статуса QR
 *
 * @module QrStatusHeader
 */

import { CheckCircle2 } from 'lucide-react';

/**
 * Пропсы компонента заголовка
 */
export interface QrStatusHeaderProps {
  /** Текст статуса (опционально) */
  statusText?: string;
}

/**
 * Заголовок статуса QR
 *
 * @param {QrStatusHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок с иконкой
 *
 * @example
 * ```tsx
 * <QrStatusHeader statusText="Ожидание сканирования..." />
 * ```
 */
export function QrStatusHeader({ statusText = 'Ожидание сканирования...' }: QrStatusHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <CheckCircle2 className="h-5 w-5 text-green-600 animate-pulse" />
      <p className="text-sm font-medium text-green-800 dark:text-green-200">
        {statusText}
      </p>
    </div>
  );
}
