/**
 * @fileoverview Компонент отображения фото в ответе пользователя
 * @description Рендерит изображение из различных источников (media, photoUrl, URL)
 */

import { ResponseData } from '../../types';

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
    return (
      <div className="rounded-lg overflow-hidden max-w-md">
        <img
          src={responseData.photoUrl}
          alt="Фото ответ"
          className="w-full h-auto rounded-lg border border-border"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'text-xs text-muted-foreground italic';
            fallback.textContent = 'Файл не найден';
            img.parentNode?.appendChild(fallback);
          }}
        />
      </div>
    );
  }

  // Тип photo/image
  if (responseData?.type === 'photo' || responseData?.type === 'image') {
    const valueStr = String(answerValue || '');
    const isUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');

    if (isUrl) {
      return (
        <div className="rounded-lg overflow-hidden max-w-md">
          <img
            src={valueStr}
            alt="Фото ответ"
            className="w-full h-auto rounded-lg border border-border"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-muted-foreground italic';
              fallback.textContent = 'Файл не найден';
              img.parentNode?.appendChild(fallback);
            }}
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
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-muted-foreground italic';
              fallback.textContent = 'Файл не найден';
              img.parentNode?.appendChild(fallback);
            }}
          />
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Фото (загрузка...)</span>
      </div>
    );
  }

  return null;
}
