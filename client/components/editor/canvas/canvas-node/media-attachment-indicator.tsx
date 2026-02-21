/**
 * @fileoverview Компонент индикатора прикреплённых медиафайлов
 * 
 * Отображает визуальное представление прикреплённых не-image файлов:
 * видео, аудио или документов к сообщению.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента MediaAttachmentIndicator
 *
 * @interface MediaAttachmentIndicatorProps
 * @property {Node} node - Узел с прикреплёнными медиафайлами
 */
interface MediaAttachmentIndicatorProps {
  node: Node;
}

/**
 * Компонент индикатора прикреплённых медиафайлов
 *
 * @component
 * @description Отображает индикатор прикреплённого видео, аудио или документа
 *
 * @param {MediaAttachmentIndicatorProps} props - Свойства компонента
 * @param {Node} props.node - Узел с медиафайлами
 *
 * @returns {JSX.Element} Компонент индикатора медиафайлов
 */
export function MediaAttachmentIndicator({ node }: MediaAttachmentIndicatorProps) {
  const getMediaInfo = () => {
    if (node.data.videoUrl) {
      return { icon: 'video', text: 'Видео прикреплено' };
    }
    if (node.data.audioUrl) {
      return { icon: 'music', text: 'Аудио прикреплено' };
    }
    if (node.data.documentUrl) {
      return { icon: 'file', text: 'Документ прикреплен' };
    }
    return null;
  };

  const mediaInfo = getMediaInfo();
  if (!mediaInfo) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50">
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <i className={`fas fa-${mediaInfo.icon} text-sm`}></i>
        <span>{mediaInfo.text}</span>
      </div>
    </div>
  );
}
