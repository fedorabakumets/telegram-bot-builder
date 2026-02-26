/**
 * @fileoverview Компонент отображения медиа в ответе пользователя
 * @description Показывает фото/изображения из ответа
 */

import { useState } from 'react';
import { ResponseData } from '../../types';
import { FileNotFound } from '../file-not-found';

/**
 * Пропсы компонента ResponseMedia
 */
interface ResponseMediaProps {
  /** Данные ответа */
  responseData: ResponseData;
  /** Значение ответа */
  answerValue: string;
  /** Функция поиска URL по file_id */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Компонент медиа в ответе
 * @param props - Пропсы компонента
 * @returns JSX компонент медиа или null
 */
export function ResponseMedia({
  responseData,
  answerValue,
  getPhotoUrlFromMessages,
}: ResponseMediaProps): React.JSX.Element | null {
  const [imageError, setImageError] = useState(false);

  // Медиа массив
  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
    return (
      <div className="rounded-lg overflow-hidden max-w-md space-y-2">
        {responseData.media.map((m: any, idx: number) => (
          <img
            key={idx}
            src={m.url || m}
            alt="Ответ фото"
            className="w-full h-auto rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ))}
      </div>
    );
  }

  // Photo URL
  if (responseData?.photoUrl) {
    if (imageError) {
      return <FileNotFound />;
    }
    return (
      <div className="rounded-lg overflow-hidden max-w-md">
        <img
          src={responseData.photoUrl}
          alt="Фото ответ"
          className="w-full h-auto rounded-lg border border-border"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Тип photo/image
  if (responseData?.type === 'photo' || responseData?.type === 'image') {
    const valueStr = String(answerValue || '');
    const isUrl =
      valueStr.startsWith('http://') ||
      valueStr.startsWith('https://') ||
      valueStr.startsWith('/uploads/');

    if (imageError) {
      return <FileNotFound />;
    }

    if (isUrl) {
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={valueStr}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    const photoUrl = getPhotoUrlFromMessages(valueStr);
    if (photoUrl) {
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={photoUrl}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
          Фото (загрузка...)
        </span>
      </div>
    );
  }

  // File ID check
  const isLikelyFileId = answerValue.length > 40 && /^[A-Za-z0-9_\-]+$/.test(answerValue);
  if (isLikelyFileId) {
    const photoUrl = getPhotoUrlFromMessages(answerValue);
    if (photoUrl) {
      if (imageError) {
        return <FileNotFound />;
      }
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={photoUrl}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
  }

  // URL check
  const isImageUrl =
    answerValue.startsWith('http://') ||
    answerValue.startsWith('https://') ||
    answerValue.startsWith('/uploads/');
  if (isImageUrl) {
    if (imageError) {
      return <FileNotFound />;
    }
    return (
      <div className="rounded-lg overflow-hidden max-w-md">
        <img
          src={answerValue}
          alt="Ответ"
          className="w-full h-auto rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return null;
}
