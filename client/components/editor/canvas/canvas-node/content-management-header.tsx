/**
 * @fileoverview Компонент заголовка узла управления контентом
 * 
 * Отображает заголовок для узлов управления контентом:
 * закрепление/открепление сообщения, удаление сообщения и пересылка.
 */

import { Node } from '@/types/bot';

/**
 * Типы узлов управления контентом
 */
type ContentManagementType = 'pin_message' | 'unpin_message' | 'delete_message' | 'forward_message';

/**
 * Интерфейс свойств компонента ContentManagementHeader
 *
 * @interface ContentManagementHeaderProps
 * @property {Node} node - Узел с данными
 * @property {ContentManagementType} type - Тип узла
 */
interface ContentManagementHeaderProps {
  node: Node;
  type: ContentManagementType;
}

/**
 * Компонент заголовка управления контентом
 *
 * @component
 * @description Отображает заголовок для узлов управления контентом
 *
 * @param {ContentManagementHeaderProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 * @param {ContentManagementType} props.type - Тип узла
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function ContentManagementHeader({ node, type }: ContentManagementHeaderProps) {
  const labels: Record<ContentManagementType, string> = {
    pin_message: 'Управление контентом',
    unpin_message: 'Управление контентом',
    delete_message: 'Управление контентом',
    forward_message: 'Переслать сообщение',
  };

  const chipClasses: Record<ContentManagementType, string> = {
    pin_message: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
    unpin_message: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
    delete_message: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    forward_message: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  };

  return (
    <span className="flex flex-col gap-2">
      <span className={`font-mono text-sm px-2 py-1 rounded-lg border inline-block w-fit ${chipClasses[type]}`}>
        {node.data.command || `/${type}`}
      </span>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
        {labels[type]}
      </span>
    </span>
  );
}
