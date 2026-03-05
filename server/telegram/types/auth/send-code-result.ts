/**
 * @fileoverview Результат отправки кода подтверждения
 * @module server/telegram/types/auth/send-code-result
 */

/**
 * Результат операции отправки кода подтверждения
 */
export interface SendCodeResult {
  /** Успешность операции */
  success: boolean;
  /** Хеш кода телефона для последующей проверки */
  phoneCodeHash?: string;
  /** Массив хешей кодов (при множественной отправке) */
  phoneCodeHashes?: string[];
  /** Сообщение об ошибке */
  error?: string;
  /** Тип доставленного кода (SMS, звонок, приложение) */
  codeType?: string;
}
