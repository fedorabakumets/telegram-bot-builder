/**
 * @fileoverview Компонент настройки стикера
 * 
 * Блок управления настройками стикера: URL/file_id и название набора.
 * 
 * @module StickerConfiguration
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента настройки стикера
 */
interface StickerConfigurationProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки стикера
 * 
 * Позволяет указать:
 * - URL стикера или file_id из Telegram
 * - Название набора стикеров (опционально)
 * 
 * @param {StickerConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация стикера
 */
export function StickerConfiguration({
  selectedNode,
  onNodeUpdate
}: StickerConfigurationProps) {
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5">
      {/* Sticker URL Section */}
      <div className="bg-gradient-to-br from-yellow-50/40 to-orange-50/20 dark:from-yellow-950/30 dark:to-orange-900/20 border border-yellow-200/40 dark:border-yellow-800/40 rounded-xl p-3 sm:p-4 md:p-5 backdrop-blur-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
            <i className="fas fa-smile text-yellow-600 dark:text-yellow-400 text-xs"></i>
          </div>
          <Label className="text-xs sm:text-sm font-bold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
            <i className="fas fa-smile text-yellow-600 dark:text-yellow-400 text-sm"></i>
            Настройки стикера
          </Label>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-2.5 block flex items-center gap-2">
              <i className="fas fa-link text-yellow-600 dark:text-yellow-400"></i>
              URL стикера или file_id
            </Label>
            <Input
              value={selectedNode.data.stickerUrl || selectedNode.data.stickerFileId || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { stickerUrl: e.target.value })}
              className="text-xs sm:text-sm border-yellow-200 dark:border-yellow-700 focus:border-yellow-500 focus:ring-yellow-200/50"
              placeholder="CAACAgIAAxkBAAICGGXm2Kv..."
            />
            <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 mt-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/40">
              <i className="fas fa-circle-info text-yellow-600 dark:text-yellow-400 text-xs mt-0.5 flex-shrink-0"></i>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                Укажите file_id из Telegram или URL с прямой ссылкой
              </p>
            </div>
          </div>

          <div>
            <Label className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-2.5 block flex items-center gap-2">
              <i className="fas fa-tag text-yellow-600 dark:text-yellow-400"></i>
              Набор стикеров
            </Label>
            <Input
              value={selectedNode.data.stickerSetName || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { stickerSetName: e.target.value })}
              className="text-xs sm:text-sm border-yellow-200 dark:border-yellow-700 focus:border-yellow-500 focus:ring-yellow-200/50"
              placeholder="mystickerpack_by_mybot"
            />
            <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 mt-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/40">
              <i className="fas fa-circle-info text-yellow-600 dark:text-yellow-400 text-xs mt-0.5 flex-shrink-0"></i>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                Название набора стикеров (опционально)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
