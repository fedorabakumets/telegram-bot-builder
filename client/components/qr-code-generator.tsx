/**
 * @fileoverview Компонент для отображения QR-кода
 *
 * Предназначен для генерации и отображения QR-кодов
 * с использованием библиотеки qrcode (без React-обёртки).
 *
 * @module QrCodeGenerator
 */

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Свойства компонента QR-кода
 * @interface QrCodeGeneratorProps
 * @property {string} value - Данные для кодирования в QR-коде
 * @property {number} [size=200] - Размер QR-кода в пикселях
 */
interface QrCodeGeneratorProps {
  value: string;
  size?: number;
}

/**
 * Компонент генерации QR-кода
 *
 * Генерирует QR-код как SVG изображение с высоким уровнем коррекции ошибок.
 *
 * @param {QrCodeGeneratorProps} props - Свойства компонента
 * @returns {JSX.Element} SVG элемент с QR-кодом
 *
 * @example
 * ```tsx
 * <QrCodeGenerator value="tg://login?token=abc123" size={200} />
 * ```
 */
export function QrCodeGenerator({ value, size = 200 }: QrCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    /**
     * Генерирует QR-код на canvas
     */
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;

      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
      } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
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
}
