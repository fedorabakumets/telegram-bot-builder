/**
 * @fileoverview Параметры для обработки ввода пользователя
 * Используется при генерации обработчиков пользовательского ввода
 */

/**
 * Параметры для обработки ввода пользователя
 */
export interface UserInputParams {
  /** ID узла */
  nodeId: string;
  /** Переменная для сохранения */
  inputVariable: string;
  /** Цель перехода после ввода */
  inputTarget: string | null;
  /** Флаг пропуска сбора данных */
  skipDataCollection?: boolean;
}
