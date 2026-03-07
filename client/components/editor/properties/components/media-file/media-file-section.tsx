/**
 * @fileoverview Секция прикрепленного медиафайла
 * 
 * Объединяет заголовок и MediaSelector.
 */

import { MediaFileSectionHeader } from './media-file-section-header';
import { MediaFileSectionContent } from './media-file-section-content';

/** Пропсы секции медиафайлов */
interface MediaFileSectionProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный узел */
  selectedNode: any;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент секции прикрепленного медиафайла
 * 
 * @param {MediaFileSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция медиафайла
 */
export function MediaFileSection({
  projectId,
  selectedNode,
  isOpen,
  onToggle,
  onNodeUpdate
}: MediaFileSectionProps) {
  const mediaUrl = selectedNode.data.imageUrl || selectedNode.data.videoUrl ||
                   selectedNode.data.audioUrl || selectedNode.data.documentUrl;

  return (
    <div className="bg-gradient-to-br from-pink-50/40 to-rose-50/20 dark:from-pink-950/30 dark:to-rose-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-pink-200/40 dark:border-pink-800/40 backdrop-blur-sm">
      <MediaFileSectionHeader isOpen={isOpen} onToggle={onToggle} />

      {isOpen && (
        <MediaFileSectionContent
          projectId={projectId}
          nodeId={selectedNode.id}
          mediaUrl={mediaUrl}
          attachedMedia={selectedNode.data.attachedMedia}
          onNodeUpdate={onNodeUpdate}
        />
      )}
    </div>
  );
}
