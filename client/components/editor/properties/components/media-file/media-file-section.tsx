/**
 * @fileoverview Секция прикрепленных медиафайлов
 *
 * Поддерживает несколько файлов через MultiMediaSelector.
 * Показывает предупреждение при смешивании документов с другими типами медиа.
 */

import { MediaFileSectionHeader } from './media-file-section-header';
import { MultiMediaSelector } from '../../media/multi-media-selector';
import { InfoBlock } from '@/components/ui/info-block';

/** Пропсы секции медиафайлов */
interface MediaFileSectionProps {
  projectId: number;
  selectedNode: any;
  isOpen: boolean;
  onToggle: () => void;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/** Определение типа медиа по URL */
function getMediaTypeByUrl(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

/**
 * Секция прикрепленных медиафайлов
 */
export function MediaFileSection({
  projectId,
  selectedNode,
  isOpen,
  onToggle,
  onNodeUpdate
}: MediaFileSectionProps) {
  const attachedFiles = selectedNode.data.attachedMedia || [];

  // Проверяем наличие смешанных типов
  const hasDocuments = attachedFiles.some((url: string) => getMediaTypeByUrl(url) === 'document');
  const hasOtherMedia = attachedFiles.some((url: string) =>
    ['image', 'video', 'audio'].includes(getMediaTypeByUrl(url))
  );
  const showMixedWarning = hasDocuments && hasOtherMedia;

  return (
    <div className="bg-gradient-to-br from-pink-50/40 to-rose-50/20 dark:from-pink-950/30 dark:to-rose-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-pink-200/40 dark:border-pink-800/40 backdrop-blur-sm">
      <MediaFileSectionHeader isOpen={isOpen} onToggle={onToggle} />

      {isOpen && (
        <div className="space-y-3">
          {showMixedWarning && (
            <InfoBlock
              variant="warning"
              title="⚠️ Документы отправятся отдельным сообщением"
              description="Telegram не позволяет смешивать документы с фото/видео/аудио. Бот отправит их двумя отдельными группами."
            />
          )}

          <MultiMediaSelector
            projectId={projectId}
            value={attachedFiles}
            onChange={(urls) => onNodeUpdate(selectedNode.id, { attachedMedia: urls })}
            nodeName={selectedNode.id}
            label="Прикреплённые файлы"
            placeholder="Введите URL или выберите файл"
            keyboardType={selectedNode.data.keyboardType}
            onNodeUpdate={onNodeUpdate}
            nodeId={selectedNode.id}
          />
        </div>
      )}
    </div>
  );
}
