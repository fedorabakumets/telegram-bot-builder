/**
 * @fileoverview Компонент превью прикреплённого изображения
 * 
 * Отображает визуальное представление прикреплённого изображения
 * с обработкой ошибок загрузки.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента ImageAttachment
 *
 * @interface ImageAttachmentProps
 * @property {Node} node - Узел с прикреплённым изображением
 */
interface ImageAttachmentProps {
  node: Node;
}

/**
 * Компонент прикреплённого изображения
 *
 * @component
 * @description Отображает превью изображения с fallback при ошибке
 *
 * @param {ImageAttachmentProps} props - Свойства компонента
 * @param {Node} props.node - Узел с изображением
 *
 * @returns {JSX.Element | null} Компонент изображения или null если нет URL
 */
export function ImageAttachment({ node }: ImageAttachmentProps) {
  if (!node.data.imageUrl) {
    return null;
  }

  const errorPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f5f5f5" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23999"%3EОшибка%3C/text%3E%3C/svg%3E';

  return (
    <div className="mb-4 rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-700/50">
      <img
        src={node.data.imageUrl}
        alt="Attached"
        className="w-full h-auto max-h-48 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = errorPlaceholder;
        }}
      />
    </div>
  );
}
