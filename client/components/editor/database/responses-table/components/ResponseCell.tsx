/**
 * @fileoverview Компонент ячейки ответа
 * @description Отображает содержимое ячейки с ответом пользователя
 * @description Использует переиспользуемый компонент ResponsePhoto из user-database
 */

import React from 'react';
import type { ResponseData, ResponseCellProps } from '../types';
import { ResponsePhoto } from './response-photo';

/**
 * Компонент ячейки с ответом
 * @param {ResponseCellProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент ячейки
 */
export function ResponseCell({ responseData, answerValue }: ResponseCellProps): React.JSX.Element {
  // Пробуем отобразить медиа через ResponsePhoto
  const mediaComponent = (
    <ResponsePhoto
      responseData={responseData}
      answerValue={answerValue}
      getPhotoUrlFromMessages={() => null}
    />
  );

  // Если ResponsePhoto вернул null (текстовый ответ), отображаем текст
  if (mediaComponent === null) {
    return (
      <p className="text-[9px] xs:text-[10px] sm:text-xs text-green-800 dark:text-green-200 font-medium break-words max-w-full leading-tight">
        {answerValue === 'undefined' || answerValue === 'null' ? '-' : answerValue}
      </p>
    );
  }

  return mediaComponent;
}
