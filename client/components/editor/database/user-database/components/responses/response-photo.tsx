/**
 * @fileoverview Компонент отображения фото в ответе пользователя
 * @description Рендерит изображение, аудио, видео из различных источников
 */

import { ResponseData } from '../../types';
import { useState } from 'react';
import { FileNotFound } from '../file-not-found';

/**
 * Пропсы компонента ResponsePhoto
 */
interface ResponsePhotoProps {
  /** Данные ответа пользователя */
  responseData: ResponseData;
  /** Значение ответа (строка) */
  answerValue: string;
  /** Функция поиска URL фото по file_id в сообщениях */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Компонент отображения фото в ответе
 * @param props - Пропсы компонента
 * @returns JSX компонент фото ответа
 */
export function ResponsePhoto({
  responseData,
  answerValue,
  getPhotoUrlFromMessages,
}: ResponsePhotoProps): React.JSX.Element | null {
  const [mediaError, setMediaError] = useState(false);

  // Медиа массив
  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
    return (
      <div className="rounded-lg overflow-hidden max-w-md space-y-2">
        {responseData.media.map((m: any, idx: number) => {
          const url = typeof m === 'string' ? m : m.url;
          const isAudio = url?.includes('.mp3') || url?.includes('.ogg') || url?.includes('.wav');
          const isVideo = url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');

          if (mediaError) {
            return <FileNotFound key={idx} />;
          }

          if (isAudio) {
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

          if (isVideo) {
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

          return (
            <img
              key={idx}
              src={url}
              alt="Ответ фото"
              className="w-full h-auto rounded-lg"
              onError={() => setMediaError(true)}
            />
          );
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
    const isUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');

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

    // File_id без URL — показываем заглушку
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Фото (загрузка...)</span>
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

  return null;
}
