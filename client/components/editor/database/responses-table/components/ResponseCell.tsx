/**
 * @fileoverview Компонент ячейки ответа
 * @description Отображает содержимое ячейки с ответом пользователя
 * @description Использует переиспользуемый компонент ResponsePhoto из user-database
 */

import React from 'react';
import type { ResponseData, ResponseCellProps } from '../types';
import { ResponsePhoto } from './response-photo';

/**
 * Проверяет, является ли ответ медиа
 */
function isMediaResponse(responseData: ResponseData): boolean {
  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
    return true;
  }
  if (responseData?.photoUrl) return true;
  if (responseData?.type === 'photo' || responseData?.type === 'image') return true;
  if (responseData?.type === 'document') return true;
  if (responseData?.type === 'audio') return true;
  if (responseData?.type === 'video') return true;
  return false;
}

/**
 * Компонент ячейки с ответом
 * @param {ResponseCellProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент ячейки
 */
export function ResponseCell({ responseData, answerValue }: ResponseCellProps): React.JSX.Element {
  // Проверяем, является ли ответ медиа
  if (isMediaResponse(responseData)) {
    return (
      <ResponsePhoto
        responseData={responseData}
        answerValue={answerValue}
        getPhotoUrlFromMessages={() => null}
      />
    );
  }

  // Текстовый ответ
  return (
    <p className="text-[9px] xs:text-[10px] sm:text-xs text-green-800 dark:text-green-200 font-medium break-words max-w-full leading-tight">
      {answerValue === 'undefined' || answerValue === 'null' ? '-' : answerValue}
    </p>
  );
}
