/**
 * @fileoverview Компонент превью прикреплённого изображения
 *
 * Отображает визуальное представление прикреплённого изображения.
 * Поддерживает обычные URL, пути /uploads/ и переменные вида {var.path}.
 */

import { Node } from '@/types/bot';

/**
 * Проверяет, является ли строка переменной вида {var.path}
 * @param url - Строка для проверки
 * @returns true если строка является переменной-плейсхолдером
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
}

/** Пропсы компонента ImageAttachment */
interface ImageAttachmentProps {
  /** Узел с прикреплённым изображением */
  node: Node;
}

/** SVG-заглушка при ошибке загрузки изображения */
const ERROR_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f5f5f5" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23999"%3EОшибка%3C/text%3E%3C/svg%3E';

/**
 * Компонент прикреплённого изображения
 *
 * Если imageUrl является переменной-плейсхолдером — показывает бейдж с именем переменной.
 * Иначе — рендерит тег img с fallback при ошибке загрузки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null если нет URL
 */
export function ImageAttachment({ node }: ImageAttachmentProps) {
  const { imageUrl } = node.data;

  if (!imageUrl) {
    return null;
  }

  // Переменная вида {var.path} — показываем бейдж вместо img
  if (isVariablePlaceholder(imageUrl)) {
    return (
      <div className="mb-4 rounded-lg border-2 border-amber-200 dark:border-amber-700/50 p-3 flex items-center gap-2">
        <span className="text-lg">🖼️</span>
        <span className="text-xs font-mono text-amber-700 dark:text-amber-300">{imageUrl}</span>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-700/50">
      <img
        src={imageUrl}
        alt="Attached"
        className="w-full h-auto max-h-48 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = ERROR_PLACEHOLDER;
        }}
      />
    </div>
  );
}
