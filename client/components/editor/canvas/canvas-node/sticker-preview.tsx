/**
 * @fileoverview Компонент превью для узла типа "Стикер"
 * 
 * Отображает визуальное представление стикера с иконкой,
 * статусом загрузки и информацией о типе стикера.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента StickerPreview
 *
 * @interface StickerPreviewProps
 * @property {Node} node - Узел типа sticker для отображения
 */
interface StickerPreviewProps {
  node: Node;
}

/**
 * Компонент превью стикера
 *
 * @component
 * @description Отображает превью узла со стикером
 *
 * @param {StickerPreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел типа sticker
 *
 * @returns {JSX.Element} Компонент превью стикера
 */
export function StickerPreview({ node }: StickerPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-pink-100/50 to-fuchsia-100/50 dark:from-pink-900/30 dark:to-fuchsia-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
      <div className="text-center space-y-2">
        <i className="fas fa-laugh text-pink-400 dark:text-pink-300 text-3xl"></i>
        {node.data.stickerUrl || node.data.stickerFileId ? (
          <div className="text-xs text-pink-600 dark:text-pink-400 space-y-1">
            <div className="font-medium">Стикер загружен</div>
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-images text-xs"></i>
              <span>Анимированный</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-pink-500 dark:text-pink-400">Добавьте URL стикера</div>
        )}
      </div>
    </div>
  );
}
