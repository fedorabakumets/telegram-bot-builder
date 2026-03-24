/**
 * @fileoverview Превью медиа-ноды на канвасе
 * Отображает прикреплённые медиафайлы с иконками типов
 */

import { getMediaTypeByUrl, MEDIA_TYPE_ICONS } from './media-node-utils';

/** Пропсы компонента превью медиа-ноды */
interface MediaNodePreviewProps {
  /** Массив URL прикреплённых медиафайлов */
  attachedMedia: string[];
}

/**
 * Превью медиа-ноды на канвасе
 * Показывает количество файлов и иконки их типов
 *
 * @param {MediaNodePreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Превью медиа-ноды
 */
export function MediaNodePreview({ attachedMedia }: MediaNodePreviewProps) {
  if (!attachedMedia || attachedMedia.length === 0) {
    return (
      <div className="bg-gradient-to-br from-fuchsia-100/50 to-purple-100/50 dark:from-fuchsia-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-4 h-24 flex items-center justify-center">
        <div className="text-center space-y-1">
          <i className="fas fa-photo-video text-fuchsia-400 dark:text-fuchsia-300 text-2xl"></i>
          <div className="text-xs text-fuchsia-500 dark:text-fuchsia-400">Нет файлов</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-fuchsia-100/50 to-purple-100/50 dark:from-fuchsia-900/30 dark:to-purple-900/30 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <i className="fas fa-photo-video text-fuchsia-500 dark:text-fuchsia-400 text-sm"></i>
        <span className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">
          {attachedMedia.length} {attachedMedia.length === 1 ? 'файл' : 'файлов'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {attachedMedia.slice(0, 6).map((url, i) => {
          const type = getMediaTypeByUrl(url);
          const icon = MEDIA_TYPE_ICONS[type] || MEDIA_TYPE_ICONS.document;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-fuchsia-200/60 dark:bg-fuchsia-800/40 text-fuchsia-700 dark:text-fuchsia-300 text-xs"
            >
              <i className={`${icon} text-[10px]`}></i>
            </span>
          );
        })}
        {attachedMedia.length > 6 && (
          <span className="text-xs text-fuchsia-500 dark:text-fuchsia-400">+{attachedMedia.length - 6}</span>
        )}
      </div>
    </div>
  );
}
