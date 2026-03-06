/**
 * @fileoverview Компонент для отображения QR-кода
 *
 * Предназначен для генерации и отображения QR-кодов
 * с использованием библиотеки qrcode (без React-обёртки).
 *
 * @module QrCodeGenerator
 */

import { useEffect, useRef, memo } from 'react';
import QRCode from 'qrcode';
import type { QrCodeGeneratorProps } from '../types/qr-code-generator-props';
import { QR_DEFAULT_SIZE, QR_ERROR_CORRECTION } from '../constants';
import { createLogger } from '../services/logger-service';

const logger = createLogger({ prefix: '[QrCodeGenerator]' });

/**
 * Компонент генерации QR-кода
 *
 * Генерирует QR-код как Canvas изображение с высоким уровнем коррекции ошибок.
 *
 * @param {QrCodeGeneratorProps} props - Свойства компонента
 * @returns {JSX.Element} Canvas элемент с QR-кодом
 *
 * @example
 * ```tsx
 * <QrCodeGenerator value="tg://login?token=abc123" size={200} />
 * ```
 */
export const QrCodeGenerator = memo(function QrCodeGenerator({ value, size = QR_DEFAULT_SIZE }: QrCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;

      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: QR_ERROR_CORRECTION,
        });
      } catch (error) {
        logger.error('Ошибка генерации QR-кода', error);
      }
    };

    generateQR();
  }, [value, size]);

  if (!value) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-xs">QR-код</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />;
}, (prev, next) => prev.value === next.value && prev.size === next.size);
