/**
 * @fileoverview Компонент превью для узла типа "Опрос" (Poll)
 * 
 * Отображает визуальное представление опроса с иконкой,
 * вопросом, количеством вариантов и поддержкой множественного выбора.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента PollPreview
 *
 * @interface PollPreviewProps
 * @property {Node} node - Узел типа poll для отображения
 */
interface PollPreviewProps {
  node: Node;
}

/**
 * Компонент превью опроса
 *
 * @component
 * @description Отображает превью узла с опросом
 *
 * @param {PollPreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел типа poll
 *
 * @returns {JSX.Element} Компонент превью опроса
 */
export function PollPreview({ node }: PollPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-violet-100/50 to-purple-100/50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
      <div className="text-center space-y-2">
        <i className="fas fa-poll text-violet-400 dark:text-violet-300 text-3xl"></i>
        <div className="text-xs text-violet-600 dark:text-violet-400 space-y-1">
          <div className="font-medium">{node.data.question || 'Опрос'}</div>
          {node.data.options && node.data.options.length > 0 && (
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-list text-xs"></i>
              <span>{node.data.options.length} вариантов</span>
            </div>
          )}
          {node.data.allowsMultipleAnswers && (
            <div className="text-xs text-violet-500 dark:text-violet-400">Множественный выбор</div>
          )}
        </div>
      </div>
    </div>
  );
}
