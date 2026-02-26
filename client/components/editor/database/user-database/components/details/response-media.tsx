/**
 * @fileoverview Компонент отображения медиа в ответе пользователя
 * @description Показывает фото, аудио, видео из ответа
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
 * Определяет тип медиа по URL или типу
 */
function getMediaType(url: string, type?: string): 'audio' | 'video' | 'image' | null {
  if (type === 'audio' || url.includes('.mp3') || url.includes('.ogg') || url.includes('.wav')) {
    return 'audio';
  }
  if (type === 'video' || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
    return 'video';
  }
  if (type === 'photo' || type === 'image' || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) {
    return 'image';
  }
  return null;
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
  const [mediaError, setMediaError] = useState(false);

  // Медиа массив
  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
    const hasError = mediaError;
    
    return (
      <div className="space-y-2">
        {responseData.media.map((m: any, idx: number) => {
          const url = typeof m === 'string' ? m : m.url;
          const mediaType = getMediaType(url, responseData?.type);

          if (hasError) {
            return <FileNotFound key={idx} />;
          }

          if (mediaType === 'audio') {
            return (
              <audio
                key={idx}
                src={url}
                controls
                className="w-full"
                onError={() => setMediaError(true)}
              />
            );
          }

          if (mediaType === 'video') {
            return (
              <video
                key={idx}
                src={url}
                controls
                className="w-full rounded-lg"
                onError={() => setMediaError(true)}
              />
            );
          }

          if (mediaType === 'image') {
            return (
              <img
                key={idx}
                src={url}
                alt="Ответ фото"
                className="w-full h-auto rounded-lg"
                onError={() => setMediaError(true)}
              />
            );
          }

          return <FileNotFound key={idx} />;
        })}
      </div>
    );
  }

  // Photo URL
  if (responseData?.photoUrl) {
    if (mediaError) {
      return <FileNotFound />;
    }
    return (
      <div className="rounded-lg overflow-hidden max-w-md">
        <img
          src={responseData.photoUrl}
          alt="Фото ответ"
          className="w-full h-auto rounded-lg border border-border"
          onError={() => setMediaError(true)}
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

    if (mediaError) {
      return <FileNotFound />;
    }

    if (isUrl) {
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={valueStr}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={() => setMediaError(true)}
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
            onError={() => setMediaError(true)}
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

  // Тип audio
  if (responseData?.type === 'audio' || answerValue.includes('.mp3') || answerValue.includes('.ogg') || answerValue.includes('.wav')) {
    const isUrl = answerValue.startsWith('http://') || answerValue.startsWith('https://') || answerValue.startsWith('/uploads/');
    
    if (mediaError) {
      return <FileNotFound />;
    }
    
    if (isUrl) {
      return (
        <audio
          src={answerValue}
          controls
          className="w-full"
          onError={() => setMediaError(true)}
        />
      );
    }
    return <FileNotFound />;
  }

  // Тип video
  if (responseData?.type === 'video' || answerValue.includes('.mp4') || answerValue.includes('.webm') || answerValue.includes('.mov')) {
    const isUrl = answerValue.startsWith('http://') || answerValue.startsWith('https://') || answerValue.startsWith('/uploads/');
    
    if (mediaError) {
      return <FileNotFound />;
    }
    
    if (isUrl) {
      return (
        <video
          src={answerValue}
          controls
          className="w-full rounded-lg"
          onError={() => setMediaError(true)}
        />
      );
    }
    return <FileNotFound />;
  }

  // File ID check
  const isLikelyFileId = answerValue.length > 40 && /^[A-Za-z0-9_\-]+$/.test(answerValue);
  if (isLikelyFileId) {
    const photoUrl = getPhotoUrlFromMessages(answerValue);
    if (photoUrl) {
      if (mediaError) {
        return <FileNotFound />;
      }
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={photoUrl}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={() => setMediaError(true)}
          />
        </div>
      );
    }
    return <FileNotFound />;
  }

  // URL check для изображений
  const isImageUrl =
    answerValue.startsWith('http://') ||
    answerValue.startsWith('https://') ||
    (answerValue.startsWith('/uploads/') && (answerValue.includes('.jpg') || answerValue.includes('.png') || answerValue.includes('.jpeg') || answerValue.includes('.gif')));
  if (isImageUrl) {
    if (mediaError) {
      return <FileNotFound />;
    }
    return (
      <div className="rounded-lg overflow-hidden max-w-md">
        <img
          src={answerValue}
          alt="Ответ"
          className="w-full h-auto rounded-lg"
          onError={() => setMediaError(true)}
        />
      </div>
    );
  }

  return null;
}
