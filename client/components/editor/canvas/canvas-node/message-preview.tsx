/**
 * @fileoverview Компонент превью текстового сообщения
 *
 * Отображает визуальное представление текстового сообщения
 * с форматированием текста (HTML или Markdown).
 */

import { Node } from '@/types/bot';
import { FormattedText } from '@/components/editor/inline-rich/components/FormattedText';

/**
 * Интерфейс свойств компонента MessagePreview
 *
 * @interface MessagePreviewProps
 * @property {Node} node - Узел с текстовым сообщением
 */
interface MessagePreviewProps {
  node: Node;
}

/**
 * Компонент превью сообщения
 *
 * @component
 * @description Отображает превью текстового сообщения с форматированием
 *
 * @param {MessagePreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел с сообщением
 *
 * @returns {JSX.Element | null} Компонент превью или null если нет текста
 */
export function MessagePreview({ node }: MessagePreviewProps) {
  if (!node.data.messageText) {
    return null;
  }

  return (
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
      <div className="flex items-start space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
        <FormattedText value={node.data.messageText} lineClamp={8} />
      </div>
    </div>
  );
}
