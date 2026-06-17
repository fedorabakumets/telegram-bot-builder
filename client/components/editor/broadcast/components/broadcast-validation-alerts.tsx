/**
 * @fileoverview UI блока ошибок и предупреждений валидации рассылки
 * @description Показывает лимиты Telegram для текста, медиа и кнопок
 */

import { AlertTriangle, XCircle } from 'lucide-react';
import type { BroadcastMessageValidation } from '../utils/validate-broadcast-message';

/**
 * Пропсы компонента BroadcastValidationAlerts
 */
interface BroadcastValidationAlertsProps {
  /** Результат валидации */
  validation: BroadcastMessageValidation;
  /** Показывать счётчик символов */
  showTextCounter?: boolean;
  /** Показывать списки ошибок и предупреждений */
  showMessages?: boolean;
}

/**
 * Блок предупреждений и ошибок валидации сообщения рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function BroadcastValidationAlerts({
  validation,
  showTextCounter = false,
  showMessages = true,
}: BroadcastValidationAlertsProps): React.JSX.Element | null {
  const { errors, warnings, plainTextLength, textLimit, mediaCount, buttonCount } = validation;
  const isOverLimit = plainTextLength > textLimit;
  const hasAlerts = (showMessages && (errors.length > 0 || warnings.length > 0)) || showTextCounter;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-2">
      {showTextCounter && (
        <p className={`text-xs text-right ${isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {plainTextLength} / {textLimit} символов
          {mediaCount > 0 ? ' (подпись к медиа)' : ''}
          {mediaCount > 0 && ` · файлов: ${mediaCount}`}
          {buttonCount > 0 && ` · кнопок: ${buttonCount}`}
        </p>
      )}

      {showMessages && errors.map((item, idx) => (
        <div
          key={`err-${idx}`}
          className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{item.message}</span>
        </div>
      ))}

      {showMessages && warnings.map((item, idx) => (
        <div
          key={`warn-${idx}`}
          className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
