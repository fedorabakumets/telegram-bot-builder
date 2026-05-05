/**
 * @fileoverview Превью прикреплённых медиафайлов
 *
 * Отображает несколько прикреплённых файлов к узлу.
 * Поддерживает обычные URL, пути /uploads/ и переменные вида {var.path}.
 *
 * @module MediaAttachmentsPreview
 */

import { useState } from 'react';
import { Node } from '@/types/bot';
import { VideoPreview } from './video-preview';

/** Пропсы компонента */
interface MediaAttachmentsPreviewProps {
  /** Узел с прикреплёнными медиафайлами */
  node: Node;
  /** ID проекта (для превью Telegram file_id через прокси) */
  projectId?: number;
}

/** Иконки для типов файлов */
const FILE_ICONS: Record<string, string> = {
  image: '🖼️',
  photo: '🖼️',
  video: '🎥',
  audio: '🎵',
  document: '📄'
};

/** SVG-заглушка при ошибке загрузки изображения */
const ERROR_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f5f5f5" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23999"%3EОшибка%3C/text%3E%3C/svg%3E';

/**
 * Проверяет, является ли строка переменной вида {var.path}
 * @param url - Строка для проверки
 * @returns true если строка является переменной-плейсхолдером
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
}

/**
 * Определяет тип медиа по URL или расширению файла.
 * Переменные вида {var.path} считаются фото по умолчанию.
 * JSON-записи Telegram file_id возвращают тип из поля mediaType.
 * @param url - URL или путь к файлу
 * @returns Тип медиа: 'image' | 'video' | 'audio' | 'document'
 */
function getMediaTypeByUrl(url: string): string {
  if (isVariablePlaceholder(url)) return 'photo';
  if (url.startsWith('{"__type":"file_id"')) {
    try { return JSON.parse(url).mediaType || 'photo'; } catch { return 'photo'; }
  }
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

/**
 * Компонент превью видео с поддержкой обложки.
 * Если задана обложка — показывает её с кнопкой Play.
 * При клике переключается на VideoPreview для воспроизведения.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
function VideoWithThumbnail({ src, thumbnailUrl }: { src: string; thumbnailUrl?: string }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!thumbnailUrl || showVideo) {
    return (
      <div className="rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700/50">
        <VideoPreview src={src} />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700/50 relative cursor-pointer"
      onClick={() => setShowVideo(true)}
    >
      <img
        src={thumbnailUrl}
        alt="обложка видео"
        className="w-full h-auto max-h-48 object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
          <span className="text-white text-xl ml-1">▶</span>
        </div>
      </div>
      <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
        <span className="text-[10px] text-white">🖼 обложка</span>
      </div>
    </div>
  );
}

/**
 * Компонент превью нескольких медиафайлов
 * @param props - Свойства компонента
 * @returns JSX элемент или null если нет медиафайлов
 */
export function MediaAttachmentsPreview({ node, projectId }: MediaAttachmentsPreviewProps) {
  const attachedMedia = node.data.attachedMedia as string[] | undefined;

  if (!attachedMedia || attachedMedia.length === 0) {
    return null;
  }

  // Если клавиатура включена и файлов > 1 — показываем только первый
  const hasKeyboard = node.data.keyboardType === 'inline' || node.data.keyboardType === 'reply';
  const mediaToDisplay = hasKeyboard && attachedMedia.length > 1
    ? [attachedMedia[0]]
    : attachedMedia;

  // Включаем обычные URL, /uploads/ пути, переменные и JSON file_id записи
  const mediaUrls = mediaToDisplay.filter(url =>
    url.startsWith('/uploads/') || url.startsWith('http') ||
    isVariablePlaceholder(url) || url.startsWith('{"__type":"file_id"')
  );

  if (mediaUrls.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {mediaUrls.map((url, index) => {
        // JSON file_id — показываем превью через прокси или карточку с типом медиа
        if (url.startsWith('{"__type":"file_id"')) {
          let mediaType = 'photo';
          let fileIdsByToken: Record<string, string> = {};
          try {
            const parsed = JSON.parse(url);
            mediaType = parsed.mediaType || 'photo';
            fileIdsByToken = parsed.fileIdsByToken || {};
          } catch {}
          const icon = FILE_ICONS[mediaType] || '📎';

          // Строим прокси URL если есть projectId и хотя бы один file_id
          const entries = Object.entries(fileIdsByToken);
          const proxyUrl = projectId && entries.length > 0
            ? `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(entries[0][1])}&tokenId=${entries[0][0]}`
            : null;

          // Для фото/видео показываем превью через прокси, для остальных — иконку
          const canPreview = proxyUrl && (mediaType === 'photo' || mediaType === 'image' || mediaType === 'video');

          return (
            <div key={url + index} className="rounded-lg border-2 border-violet-200 dark:border-violet-700/50 overflow-hidden bg-violet-50/50 dark:bg-violet-900/20">
              {canPreview ? (
                // Превью через прокси
                mediaType === 'video' ? (
                  <video
                    src={`${proxyUrl}#t=0.1`}
                    className="w-full h-auto max-h-48 object-cover"
                    muted
                    preload="metadata"
                    onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                  />
                ) : (
                  <img
                    src={proxyUrl}
                    alt={`file_id ${mediaType}`}
                    className="w-full h-auto max-h-48 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )
              ) : (
                // Fallback: иконка для аудио/документов или когда нет projectId
                <div className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 truncate">Telegram file_id ({mediaType})</p>
                    <p className="text-xs text-violet-700/70 dark:text-violet-300/70">Отправка без скачивания</p>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Переменная — показываем бейдж без попытки загрузить как img
        if (isVariablePlaceholder(url)) {
          return (
            <div key={url + index} className="rounded-lg border-2 border-amber-200 dark:border-amber-700/50 p-3 bg-amber-50/50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">Фото {index + 1}</p>
                  <p className="text-xs font-mono text-amber-700/70 dark:text-amber-300/70 truncate">{url}</p>
                </div>
              </div>
            </div>
          );
        }

        const fileType = getMediaTypeByUrl(url);

        if (fileType === 'image' || fileType === 'photo') {
          return (
            <div key={url + index} className="rounded-lg overflow-hidden border-2 border-emerald-200 dark:border-emerald-700/50">
              <img
                src={url}
                alt={`Файл ${index + 1}`}
                className="w-full h-auto max-h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ERROR_PLACEHOLDER;
                }}
              />
            </div>
          );
        }

        // Превью видеофайла — если задана обложка, показываем её; иначе VideoPreview
        if (fileType === 'video') {
          const thumbnails = node.data.attachedMediaThumbnails as Record<string, string> | undefined;
          const thumbUrl = thumbnails?.[url];
          return (
            <VideoWithThumbnail key={url + index} src={url} thumbnailUrl={thumbUrl} />
          );
        }

        // Аудио и документы — карточка с иконкой
        return (
          <div key={url + index} className="rounded-lg border-2 border-blue-200 dark:border-blue-700/50 p-3 bg-blue-50/50 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{FILE_ICONS[fileType] || '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">Файл {index + 1}</p>
                <p className="text-xs text-blue-700/70 dark:text-blue-300/70 truncate">{fileType.toUpperCase()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
