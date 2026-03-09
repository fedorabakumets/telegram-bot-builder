/**
 * @fileoverview Компонент информационных текстов QR
 *
 * @module QrInfoText
 */

/**
 * Пропсы компонента информационных текстов
 */
export interface QrInfoTextProps {
  /** Обратный отсчёт до обновления */
  countdown: number;
}

/**
 * Информационные тексты QR
 *
 * @param {QrInfoTextProps} props - Пропсы компонента
 * @returns {JSX.Element} Тексты инструкций
 *
 * @example
 * ```tsx
 * <QrInfoText countdown={30} />
 * ```
 */
export function QrInfoText({ countdown }: QrInfoTextProps) {
  return (
    <>
      <p className="text-xs text-green-700 dark:text-green-300">
        Откройте Telegram → Настройки → Устройства → Подключить устройство
      </p>
      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
        ✨ QR-код обновляется автоматически. Успейте отсканировать за {countdown} сек!
      </p>
    </>
  );
}
