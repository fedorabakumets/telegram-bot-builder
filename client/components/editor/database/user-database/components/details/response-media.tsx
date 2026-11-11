/**
 * @fileoverview Медиа ответов с независимыми состояниями недоступности файлов.
 */
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { ResponseData } from '../../types';

/** Свойства вложений ответа. */
interface ResponseMediaProps {
  /** Данные ответа. */
  responseData: ResponseData;
  /** Значение ответа. */
  answerValue: string;
  /** Поиск сохранённой фотографии. */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/** Нормализует сохранённый путь и возвращает доступный адрес файла. */
function normalizePath(value: string): string {
  const index = value.indexOf('/uploads/');
  return value.includes('/bots/') && index >= 0 ? value.slice(index) : value;
}

/** Определяет формат по явному типу или расширению пути. */
function mediaType(url: string, type?: string): string | null {
  if (['photo', 'image', 'audio', 'video', 'document'].includes(type || '')) return type === 'photo' ? 'image' : type!;
  const path = url.split(/[?#]/)[0];
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(path)) return 'image';
  if (/\.(mp3|ogg|wav|m4a)$/i.test(path)) return 'audio';
  if (/\.(mp4|webm|mov)$/i.test(path)) return 'video';
  if (/\.(pdf|docx?|xlsx?|pptx?|txt|rtf|zip)$/i.test(path)) return 'document';
  return null;
}

/** Показывает один файл; ошибка не затрагивает соседние вложения. */
function MediaItem({ url, type }: {
  /** Адрес файла. */
  url: string;
  /** Формат вложения. */
  type: string;
}): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  if (failed || !/^(https?:\/\/|\/uploads\/)/i.test(url)) {
    return <p className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground" role="status">Файл недоступен</p>;
  }
  if (type === 'image') return <img src={url} alt="Фотография из ответа пользователя" loading="lazy" className="max-h-96 w-auto max-w-full rounded-lg object-contain" onError={() => setFailed(true)} />;
  if (type === 'audio') return <audio src={url} controls preload="metadata" aria-label="Аудио из ответа пользователя" className="w-full max-w-full" onError={() => setFailed(true)} />;
  if (type === 'video') return <video src={url} controls preload="metadata" aria-label="Видео из ответа пользователя" className="max-h-96 w-full rounded-lg" onError={() => setFailed(true)} />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-lg border border-border/60 p-3 text-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 break-all">{url.split(/[?#]/)[0].split('/').pop() || 'Документ'}</span>
      <span className="shrink-0 text-xs text-muted-foreground">Открыть</span>
      <span className="sr-only">в новой вкладке</span>
    </a>
  );
}

/** Показывает вложения ответа и достоверное состояние недоступности. */
export function ResponseMedia({ responseData, answerValue, getPhotoUrlFromMessages }: ResponseMediaProps): React.JSX.Element | null {
  if (Array.isArray(responseData?.media) && responseData.media.length > 0) {
    return <div className="space-y-3">{responseData.media.map((item, index) => {
      const raw = typeof item === 'string' ? item : item?.url;
      const url = normalizePath(typeof raw === 'string' ? raw : '');
      const ownType = typeof item === 'object' && item && 'type' in item ? String(item.type) : undefined;
      return <MediaItem key={`${index}:${url}`} url={url} type={mediaType(url, ownType) || mediaType(url, responseData.type) || 'document'} />;
    })}</div>;
  }
  const value = normalizePath(responseData?.photoUrl || answerValue || '');
  const type = responseData?.photoUrl ? 'image' : mediaType(value, responseData?.type);
  const fileId = value.length > 40 && /^[A-Za-z0-9_-]+$/.test(value);
  if (!type && !fileId) return null;
  const url = /^(https?:\/\/|\/uploads\/)/i.test(value) ? value : getPhotoUrlFromMessages(value) || '';
  return <MediaItem key={url || value} url={url} type={type || 'image'} />;
}
