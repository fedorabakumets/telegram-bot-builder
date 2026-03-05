/**
 * @fileoverview Компонент отображения QR-кода с плейсхолдером
 *
 * @module QrCodeDisplay
 */

import { QrCode } from 'lucide-react';
import { QrCodeGenerator } from './qr-code-generator';
import { QrCountdownBadge } from './qr-countdown-badge';
import { QR_DEFAULT_SIZE } from '../constants';

/**
 * Пропсы компонента отображения QR-кода
 */
export interface QrCodeDisplayProps {
  /** URL для генерации QR-кода */
  url?: string;
  /** Обратный отсчёт до обновления */
  countdown: number;
}

/**
 * Компонент отображения QR-кода
 *
 * @param {QrCodeDisplayProps} props - Пропсы компонента
 * @returns {JSX.Element} QR-код или плейсхолдер
 *
 * @example
 * ```tsx
 * <QrCodeDisplay url={qrUrl} countdown={30} />
 * ```
 */
export function QrCodeDisplay({ url, countdown }: QrCodeDisplayProps) {
  return (
    <div className="bg-white p-4 rounded-lg inline-block mb-3 relative">
      {url ? (
        <>
          <QrCodeGenerator value={url} size={QR_DEFAULT_SIZE} />
          <QrCountdownBadge countdown={countdown} />
        </>
      ) : (
        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
          <QrCode className="h-16 w-16 text-gray-400" />
        </div>
      )}
    </div>
  );
}
