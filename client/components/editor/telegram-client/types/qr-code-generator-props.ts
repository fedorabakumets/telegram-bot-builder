/**
 * @fileoverview Тип свойств компонента QrCodeGenerator
 *
 * Определяет интерфейс для генератора QR-кодов.
 *
 * @module QrCodeGeneratorProps
 */

/**
 * Свойства компонента генерации QR-кода
 */
export interface QrCodeGeneratorProps {
  /** Данные для кодирования в QR-коде (URL, токен и т.д.) */
  value: string;
  /** Размер QR-кода в пикселях (по умолчанию 200) */
  size?: number;
}
