/**
 * @fileoverview Компонент медиафайлов сообщения
 * Отображает все типы медиа: фото, видео, аудио, голосовые, документы, стикеры.
 * Приоритет: локально сохранённый файл → Telegram CDN через прокси.
 */

import { useState } from 'react';
import { ImageLightbox } from './image-lightbox';

/**
 * Тип медиа из messageData
 */
type MediaType = 'photo' | 'video' | 'audio' | 'voice' | 'document' | 'sticker';

/**
 * Метаданные медиафайла из Telegram
 */
interface TelegramMediaMeta {
  /** Идентификатор файла в Telegram */
  file_id?: string;
  /** Длительность в секундах (для аудио/видео/голосовых) */
  duration?: number;
  /** Имя файла (для документов) */
  file_name?: string;
  /** Размер файла в байтах */
  file_size?: number;
  /** MIME тип */
  mime_type?: string;
  /** Эмодзи стикера */
  emoji?: string;
  /** Анимированный ли стикер */
  is_animated?: boolean;
  /** Видео-стикер */
  is_video?: boolean;
}

/**
 * Свойства медиа-контента
 */
interface MessageMediaProps {
  /** Массив сохранённых медиафайлов (из media_files в БД) */
  media?: Array<{
    /** URL медиафайла */
    url: string;
    /** Идентификатор сообщения */
    messageId?: number;
  }>;
  /** Дополнительные данные сообщения (содержит медиа-метаданные) */
  messageData?: unknown;
  /** Идентификатор проекта (для прокси-роута) */
  projectId?: number;
  /** Идентификатор токена (для прокси-роута) */
  tokenId?: number;
}

/**
 * Строит URL прокси для получения файла из Telegram CDN
 * @param fileId - Идентификатор файла в Telegram
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns URL прокси-роута
 */
function buildProxyUrl(fileId: string, projectId: number, tokenId?: number): string {
  const tokenParam = tokenId ? `&tokenId=${tokenId}` : '';
  return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(fileId)}${tokenParam}`;
}

/**
 * Извлекает медиа-данные из messageData по типу
 * @param messageData - Данные сообщения
 * @param type - Тип медиа
 * @returns Метаданные или null
 */
function extractMedia(messageData: unknown, type: MediaType): TelegramMediaMeta | null {
  if (!messageData || typeof messageData !== 'object') return null;
  const data = messageData as Record<string, unknown>;
  const meta = data[type] as TelegramMediaMeta | undefined;
  return meta?.file_id ? meta : null;
}

/**
 * Форматирует размер файла в читаемый вид
 * @param bytes - Размер в байтах
 * @returns Строка вида "1.2 MB"
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Компонент отображения медиафайлов сообщения.
 * Поддерживает: фото, видео, аудио, голосовые, документы, стикеры.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function MessageMedia({ media, messageData, projectId, tokenId }: MessageMediaProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Приоритет 1: локально сохранённые файлы из media_files
  if (Array.isArray(media) && media.length > 0) {
    return (
      <>
        <div className="rounded-lg overflow-hidden max-w-[200px] space-y-1">
          {media.map((m, idx) => (
            <img
              key={idx}
              src={m.url}
              alt="Фото"
              className="w-full h-auto rounded-lg cursor-zoom-in"
              data-testid={`dialog-photo-${m.messageId}-${idx}`}
              onClick={() => setLightboxSrc(m.url)}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
        {lightboxSrc && (
          <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </>
    );
  }

  if (!projectId) return null;

  // Приоритет 2: медиа из Telegram CDN через прокси
  const photo = extractMedia(messageData, 'photo');
  if (photo?.file_id) {
    const proxyUrl = buildProxyUrl(photo.file_id, projectId, tokenId);
    return (
      <>
        <div className="rounded-lg overflow-hidden max-w-[200px]">
          <img
            src={proxyUrl}
            alt="Фото"
            className="w-full h-auto rounded-lg cursor-zoom-in"
            onClick={() => setLightboxSrc(proxyUrl)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        {lightboxSrc && (
          <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </>
    );
  }

  const video = extractMedia(messageData, 'video');
  if (video?.file_id) {
    return (
      <div className="rounded-lg overflow-hidden max-w-[280px]">
        <video
          src={buildProxyUrl(video.file_id, projectId, tokenId)}
          controls
          className="w-full h-auto rounded-lg"
          preload="metadata"
        />
      </div>
    );
  }

  const audio = extractMedia(messageData, 'audio');
  if (audio?.file_id) {
    return (
      <div className="rounded-lg bg-muted/40 p-2 max-w-[280px]">
        <audio
          src={buildProxyUrl(audio.file_id, projectId, tokenId)}
          controls
          className="w-full"
          preload="metadata"
        />
      </div>
    );
  }

  const voice = extractMedia(messageData, 'voice');
  if (voice?.file_id) {
    return (
      <div className="rounded-lg bg-muted/40 p-2 max-w-[280px]">
        <audio
          src={buildProxyUrl(voice.file_id, projectId, tokenId)}
          controls
          className="w-full"
          preload="metadata"
        />
      </div>
    );
  }

  const document = extractMedia(messageData, 'document');
  if (document?.file_id) {
    const sizeStr = formatFileSize(document.file_size);
    return (
      <a
        href={buildProxyUrl(document.file_id, projectId, tokenId)}
        download={document.file_name || 'document'}
        className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm hover:bg-muted/60 transition-colors max-w-[280px]"
      >
        <span className="text-lg">📎</span>
        <span className="flex-1 truncate text-xs">
          {document.file_name || 'Документ'}
          {sizeStr && <span className="text-muted-foreground ml-1">({sizeStr})</span>}
        </span>
      </a>
    );
  }

  const sticker = extractMedia(messageData, 'sticker');
  if (sticker?.file_id) {
    if (sticker.is_video) {
      return (
        <div className="max-w-[120px]">
          <video
            src={buildProxyUrl(sticker.file_id, projectId, tokenId)}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          />
        </div>
      );
    }
    return (
      <div className="max-w-[120px]">
        <img
          src={buildProxyUrl(sticker.file_id, projectId, tokenId)}
          alt={sticker.emoji || 'Стикер'}
          className="w-full h-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }

  // Fallback: медиа есть в данных, но показать нельзя (нет projectId или file_id) — показываем плейсхолдер
  /** Метки для каждого типа медиа */
  const MEDIA_TYPE_LABELS: Record<string, string> = {
    photo: '[Фото]',
    video: '[Видео]',
    audio: '[Аудио]',
    voice: '[Голосовое]',
    document: '[Документ]',
    sticker: '[Стикер]',
  };
  const data = messageData as Record<string, unknown> | null;
  if (data) {
    for (const [type, label] of Object.entries(MEDIA_TYPE_LABELS)) {
      if (data[type]) {
        return <span className="text-xs text-muted-foreground italic">{label}</span>;
      }
    }
  }

  return null;
}
