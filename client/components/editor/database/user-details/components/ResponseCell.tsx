/**
 * @fileoverview Компонент ячейки ответа
 * @description Отображает содержимое ячейки с ответом пользователя
 */

import React from 'react';
import { ResponseData } from '../utils/parseResponseData';
import { ResponseImage } from './ResponseImage';

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
 * Проверяет, является ли строка URL изображения
 * @param {string} str - Строка для проверки
 * @returns {boolean} true если URL
 */
function isImageUrl(str: string): boolean {
  return str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/uploads/');
}

/**
 * Компонент ячейки с ответом
 * @param {ResponseCellProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент ячейки
 */
export function ResponseCell({ responseData, answerValue }: ResponseCellProps): React.JSX.Element {
  // Фото из ответа
  if (responseData?.photoUrl) {
    return <ResponseImage src={responseData.photoUrl} alt="Фото ответ" />;
  }

  // Медиа из ответа
  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
    return (
      <div className="rounded-lg overflow-hidden max-w-[150px] space-y-1">
        {responseData.media.map((m, idx) => {
          const url = typeof m === 'string' ? m : m.url;
          return (
            <ResponseImage key={idx} src={url} alt={`Ответ фото ${idx + 1}`} />
          );
        })}
      </div>
    );
  }

  // URL изображения
  if (isImageUrl(answerValue)) {
    return <ResponseImage src={answerValue} alt="Ответ" />;
  }

  // Текст
  return (
    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
      {answerValue}
    </p>
  );
}
