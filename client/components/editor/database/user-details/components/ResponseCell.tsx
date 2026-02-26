/**
 * @fileoverview Компонент ячейки ответа
 * @description Отображает содержимое ячейки с ответом пользователя
 * @description Использует переиспользуемый компонент ResponsePhoto из user-database
 */

import React from 'react';
import { ResponseData } from '../utils/parseResponseData';
import { ResponsePhoto } from '@/components/editor/database/user-database/components/responses/response-photo';

/**
 * @interface ResponseCellProps
 * @description Свойства ячейки ответа
 */
interface ResponseCellProps {
  /** Данные ответа */
  responseData: ResponseData;
  /** Отображаемое значение */
  answerValue: string;
}

/**
 * Компонент ячейки с ответом
 * @param {ResponseCellProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент ячейки
 */
export function ResponseCell({ responseData, answerValue }: ResponseCellProps): React.JSX.Element {
  // Используем переиспользуемый компонент ResponsePhoto
  return (
    <ResponsePhoto
      responseData={responseData}
      answerValue={answerValue}
      getPhotoUrlFromMessages={() => null}
    />
  );
}
