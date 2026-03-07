/**
 * @fileoverview Содержимое секции медиафайлов
 *
 * Компонент с MediaSelector.
 */

import { MediaSelector } from '@/components/editor/properties/media/media-selector';
import { getMediaUrlUpdates } from '../../utils/media-utils';

/** Пропсы содержимого секции медиа */
interface MediaFileSectionContentProps {
  /** ID проекта */
  projectId: number;
  /** ID узла */
  nodeId: string;
  /** Текущий URL медиафайла */
  mediaUrl?: string;
  /** Прикреплённые медиа */
  attachedMedia?: string[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент содержимого секции медиафайлов
 * 
 * @param {MediaFileSectionContentProps} props - Пропсы компонента
 * @returns {JSX.Element} Содержимое секции медиа
 */
export function MediaFileSectionContent({
  projectId,
  nodeId,
  mediaUrl,
  attachedMedia,
  onNodeUpdate
}: MediaFileSectionContentProps) {
  return (
    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-rose-50/40 to-pink-50/20 dark:from-rose-950/30 dark:to-pink-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-rose-200/40 dark:border-rose-800/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <MediaSelector
        projectId={projectId}
        value={mediaUrl || ''}
        onChange={(url: string, fileName?: string) => {
          if (!url) {
            onNodeUpdate(nodeId, {
              imageUrl: undefined,
              videoUrl: undefined,
              audioUrl: undefined,
              documentUrl: undefined,
              documentName: undefined
            });
            return;
          }

          const updates = getMediaUrlUpdates(
            url,
            nodeId,
            fileName,
            attachedMedia
          );
          onNodeUpdate(nodeId, updates);
        }}
        nodeName={nodeId}
        label=""
        placeholder="Выберите медиафайл или введите URL"
      />
    </div>
  );
}
