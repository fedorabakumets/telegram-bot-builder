/**
 * @fileoverview Тип свойств компонента TelegramAuth
 *
 * Определяет интерфейс для диалога авторизации.
 *
 * @module TelegramAuthProps
 */

/**
 * Свойства компонента авторизации Telegram
 */
export interface TelegramAuthProps {
  /** Состояние открытия диалога */
  open: boolean;
  /** Коллбэк для изменения состояния открытия */
  onOpenChange: (open: boolean) => void;
  /** Коллбэк, вызываемый при успешной авторизации */
  onSuccess: () => void;
}
