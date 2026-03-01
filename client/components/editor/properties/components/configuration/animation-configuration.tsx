/**
 * @fileoverview Компонент настройки GIF анимации
 * 
 * Блок управления настройками GIF анимации: URL и параметры.
 * 
 * @module AnimationConfiguration
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaSelector } from '@/components/editor/properties/media/media-selector';

/**
 * Пропсы компонента настройки анимации
 */
interface AnimationConfigurationProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки GIF анимации
 * 
 * Позволяет указать:
 * - URL анимации (GIF или MP4)
 * - Ширину и высоту в пикселях
 * - Длительность
 * - Название файла
 * 
 * @param {AnimationConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация анимации
 */
export function AnimationConfiguration({
  projectId,
  selectedNode,
  onNodeUpdate
}: AnimationConfigurationProps) {
  return (
    <div className="space-y-6">
      {/* Animation URL Section */}
      <div className="bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10 border border-pink-200/30 dark:border-pink-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
            <i className="fas fa-film text-pink-600 dark:text-pink-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-pink-900 dark:text-pink-100">Источник GIF анимации</Label>
        </div>

        <MediaSelector
          projectId={projectId}
          value={selectedNode.data.animationUrl || ''}
          onChange={(url) => onNodeUpdate(selectedNode.id, { animationUrl: url })}
          fileType="video"
          placeholder="https://example.com/awesome-animation.gif"
          label="Источник анимации"
        />

        <div className="flex items-center space-x-2 text-xs text-pink-600 dark:text-pink-400 mt-3">
          <i className="fas fa-check-circle"></i>
          <span>GIF, MP4 (анемация) • Макс. 50MB</span>
        </div>
      </div>

      {/* Animation Metadata Section */}
      <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
            <i className="fas fa-cog text-orange-600 dark:text-orange-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Параметры анимации</Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-arrows-alt-h mr-1"></i>
              Ширина (px)
            </Label>
            <Input
              type="number"
              value={selectedNode.data.width || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { width: parseInt(e.target.value) || 0 })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="480"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-arrows-alt-v mr-1"></i>
              Высота (px)
            </Label>
            <Input
              type="number"
              value={selectedNode.data.height || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { height: parseInt(e.target.value) || 0 })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="320"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-clock mr-1"></i>
              Длительность (сек)
            </Label>
            <Input
              type="number"
              value={selectedNode.data.muteDuration || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { muteDuration: parseInt(e.target.value) || 0 })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="5"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-file mr-1"></i>
              Название файла
            </Label>
            <Input
              value={selectedNode.data.fileName || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { fileName: e.target.value })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="animation.gif"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
