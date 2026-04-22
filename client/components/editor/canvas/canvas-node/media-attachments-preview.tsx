/**
 * @fileoverview Превью прикреплённых медиафайлов
 *
 * Отображает несколько прикреплённых файлов к узлу.
 * Поддерживает обычные URL, пути /uploads/ и переменные вида {var.path}.
 *
 * @module MediaAttachmentsPreview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента */
interface MediaAttachmentsPreviewProps {
  /** Узел с прикреплёнными медиафайлами */
  node: Node;
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
 * @param url - URL или путь к файлу
 * @returns Тип медиа: 'image' | 'video' | 'audio' | 'document'
 */
function getMediaTypeByUrl(url: string): string {
  if (isVariablePlaceholder(url)) return 'photo';
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

/**
 * Компонент превью нескольких медиафайлов
 * @param props - Свойства компонента
 * @returns JSX элемент или null если нет медиафайлов
 */
export function MediaAttachmentsPreview({ node }: MediaAttachmentsPreviewProps) {
  const attachedMedia = node.data.attachedMedia as string[] | undefined;

  if (!attachedMedia || attachedMedia.length === 0) {
    return null;
  }

  // Если клавиатура включена и файлов > 1 — показываем только первый
  const hasKeyboard = node.data.keyboardType === 'inline' || node.data.keyboardType === 'reply';
  const mediaToDisplay = hasKeyboard && attachedMedia.length > 1
    ? [attachedMedia[0]]
    : attachedMedia;

  // Включаем обычные URL, /uploads/ пути и переменные-плейсхолдеры
  const mediaUrls = mediaToDisplay.filter(url =>
    url.startsWith('/uploads/') || url.startsWith('http') || isVariablePlaceholder(url)
  );

  if (mediaUrls.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {mediaUrls.map((url, index) => {
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

        // Не изображения — карточка с иконкой
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
