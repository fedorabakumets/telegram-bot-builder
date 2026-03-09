/**
 * @fileoverview Тип пропсов ячейки ответа
 * @description Свойства для компонента ResponseCell
 */

import type { ResponseData } from './response-data';

/**
 * Свойства ячейки ответа
 */
export interface ResponseCellProps {
  /** Данные ответа */
  responseData: ResponseData;
  /** Отображаемое значение */
  answerValue: string;
}
