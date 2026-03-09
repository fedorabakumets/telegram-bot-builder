/**
 * @fileoverview Компонент отображения медиа в ответе пользователя
 * @description Показывает фото, аудио, видео, документы из ответа
 */

import { useState } from 'react';
import { ResponseData } from '../../types';
import { FileNotFound } from '../../../responses-table/components/file-not-found';
import { FileText } from 'lucide-react';

/**
 * Конвертирует полный путь к файлу в относительный серверный путь
 */
function normalizeFilePath(value: string): string {
  // Если путь содержит /bots/ и /uploads/, извлекаем относительный путь
  if (value.includes('/bots/') && value.includes('/uploads/')) {
    const uploadsIndex = value.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return value.substring(uploadsIndex);
    }
  }
  return value;
}

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
function getMediaType(url: string, type?: string): 'audio' | 'video' | 'image' | 'document' | null {
  if (type === 'audio' || url.includes('.mp3') || url.includes('.ogg') || url.includes('.wav')) {
    return 'audio';
  }
  if (type === 'video' || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
    return 'video';
  }
  if (type === 'document' || url.includes('.pdf') || url.includes('.doc') || url.includes('.docx') || url.includes('.xls') || url.includes('.xlsx') || url.includes('.ppt') || url.includes('.pptx') || url.includes('.txt') || url.includes('.rtf')) {
    return 'document';
  }
  if (type === 'photo' || type === 'image' || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) {
    return 'image';
  }
  return null;
}

/**
 * Компонент документа
 */
function DocumentFile({ url, onError }: { url: string; onError: () => void }): React.JSX.Element {
  const fileName = url.split('/').pop() || 'Файл';
  const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      onError={onError}
    >
      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
          {fileName}
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          {extension} документ
        </div>
      </div>
      <div className="text-blue-600 dark:text-blue-400 text-xs">
        Открыть →
      </div>
    </a>
  );
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

          if (mediaType === 'document') {
            return <DocumentFile key={idx} url={url} onError={() => setMediaError(true)} />;
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
    const normalizedValue = normalizeFilePath(String(answerValue || ''));
    const isUrl =
      normalizedValue.startsWith('http://') ||
      normalizedValue.startsWith('https://') ||
      normalizedValue.startsWith('/uploads/');

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

  // Тип document
  if (responseData?.type === 'document' ||
      answerValue.includes('.pdf') ||
      answerValue.includes('.doc') ||
      answerValue.includes('.docx') ||
      answerValue.includes('.xls') ||
      answerValue.includes('.xlsx') ||
      answerValue.includes('.ppt') ||
      answerValue.includes('.pptx') ||
      answerValue.includes('.txt') ||
      answerValue.includes('.rtf')) {
    const normalizedValue = normalizeFilePath(answerValue);
    const isUrl = normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://') || normalizedValue.startsWith('/uploads/');

    if (mediaError) {
      return <FileNotFound />;
    }

    if (isUrl) {
      return <DocumentFile url={normalizedValue} onError={() => setMediaError(true)} />;
    }
    return <FileNotFound />;
  }

  // Тип audio
  if (responseData?.type === 'audio' || answerValue.includes('.mp3') || answerValue.includes('.ogg') || answerValue.includes('.wav')) {
    const normalizedValue = normalizeFilePath(answerValue);
    const isUrl = normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://') || normalizedValue.startsWith('/uploads/');

    if (mediaError) {
      return <FileNotFound />;
    }

    if (isUrl) {
      return (
        <audio
          src={normalizedValue}
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
    const normalizedValue = normalizeFilePath(answerValue);
    const isUrl = normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://') || normalizedValue.startsWith('/uploads/');

    if (mediaError) {
      return <FileNotFound />;
    }

    if (isUrl) {
      return (
        <video
          src={normalizedValue}
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
