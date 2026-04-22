/**
 * @fileoverview Секция прикрепленных медиафайлов
 *
 * Поддерживает несколько файлов через MultiMediaSelector.
 * Показывает предупреждение при смешивании документов с другими типами медиа.
 * Отображает imageUrl если задан (в том числе переменные вида {var.path}).
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
  /** Показывать бейдж "Скоро обновление" (по умолчанию true) */
  showComingSoon?: boolean;
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
 * Проверяет является ли строка переменной вида {var.path}
 * @param url - Строка для проверки
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
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
  getAllNodesFromAllSheets = [],
  showComingSoon = true
}: MediaFileSectionProps) {
  const attachedFiles = selectedNode.data.attachedMedia || [];
  /** imageUrl — одиночное изображение (может быть переменной) */
  const imageUrl: string = selectedNode.data.imageUrl || '';

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
      <MediaFileSectionHeader isOpen={isOpen} onToggle={onToggle} showComingSoon={showComingSoon} />

      {isOpen && (
        <div className="space-y-3">
          {showMixedWarning && (
            <InfoBlock
              variant="warning"
              title="⚠️ Документы отправятся отдельным сообщением"
              description="Telegram не позволяет смешивать документы с фото/видео/аудио. Бот отправит их двумя отдельными группами."
            />
          )}

          {/* Отображаем imageUrl если задан — в том числе переменные */}
          {imageUrl && (
            <div className="rounded-lg border border-amber-200/60 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-900/20 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">Изображение (imageUrl)</p>
              {isVariablePlaceholder(imageUrl) ? (
                <div className="flex items-center gap-2">
                  <span className="text-base">🖼️</span>
                  <span className="text-xs font-mono text-amber-800 dark:text-amber-200 break-all">{imageUrl}</span>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="imageUrl"
                  className="w-full h-auto max-h-32 object-cover rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          )}

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
  /** Показывать бейдж "Скоро обновление" (по умолчанию true) */
  showComingSoon?: boolean;
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
  getAllNodesFromAllSheets = [],
  showComingSoon = true
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
      <MediaFileSectionHeader isOpen={isOpen} onToggle={onToggle} showComingSoon={showComingSoon} />

      {isOpen && (
        <div className="space-y-3">
          {showMixedWarning && (
            <InfoBlock
              variant="warning"
              title="⚠️ Документы отправятся отдельным сообщением"
              description="Telegram не позволяет смешивать документы с фото/видео/аудио. Бот отправит их двумя отдельными группами."
            />
          )}

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
