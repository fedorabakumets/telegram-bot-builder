/**
 * @fileoverview Секция прикрепленных медиафайлов
 *
 * Поддерживает несколько файлов через MultiMediaSelector.
 * Показывает предупреждение при смешивании документов с другими типами медиа.
 */

import { useMemo } from 'react';
import { MediaFileSectionHeader } from './media-file-section-header';
import { MultiMediaSelector } from '../../media/multi-media-selector';
import { InfoBlock } from '@/components/ui/info-block';
import { VariableSelector } from '../variables/variable-selector';
import { extractVariables } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы секции медиафайлов */
interface MediaFileSectionProps {
  projectId: number;
  selectedNode: any;
  isOpen: boolean;
  onToggle: () => void;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  getAllNodesFromAllSheets?: any[];
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
  onNodeUpdate,
  getAllNodesFromAllSheets = []
}: MediaFileSectionProps) {
  const attachedFiles = selectedNode.data.attachedMedia || [];

  // Проверяем наличие смешанных типов
  const hasDocuments = attachedFiles.some((url: string) => getMediaTypeByUrl(url) === 'document');
  const hasOtherMedia = attachedFiles.some((url: string) =>
    ['image', 'video', 'audio'].includes(getMediaTypeByUrl(url))
  );
  const showMixedWarning = hasDocuments && hasOtherMedia;

  // Извлекаем медиа-переменные из всех узлов
  const mediaVariables = useMemo((): Variable[] => {
    const nodes = getAllNodesFromAllSheets.map((n: any) => n.node ?? n);
    const { mediaVariables: vars } = extractVariables(nodes);
    return vars as Variable[];
  }, [getAllNodesFromAllSheets]);

  const handleVariableSelect = (varName: string) => {
    const current: string[] = selectedNode.data.attachedMedia || [];
    onNodeUpdate(selectedNode.id, { attachedMedia: [...current, `{${varName}}`] });
  };

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

          {mediaVariables.length > 0 && (
            <div className="flex justify-end">
              <VariableSelector
                availableVariables={mediaVariables}
                onSelect={handleVariableSelect}
                trigger={
                  <button className="text-xs px-2.5 py-1 rounded-lg border border-rose-300/60 dark:border-rose-700/60 bg-rose-50/60 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-800/30 transition-colors">
                    + Переменная
                  </button>
                }
              />
            </div>
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
