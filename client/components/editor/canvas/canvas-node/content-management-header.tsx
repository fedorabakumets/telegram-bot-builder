/**
 * @fileoverview Компонент заголовка узла управления контентом
 * 
 * Отображает заголовок для узлов управления контентом:
 * закрепление/открепление сообщения, удаление сообщения.
 */

import { Node } from '@/types/bot';

/**
 * Типы узлов управления контентом
 */
type ContentManagementType = 'pin_message' | 'unpin_message' | 'delete_message';

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
  return (
    <span className="flex flex-col gap-2">
      <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 inline-block w-fit">
        {node.data.command || `/${type}`}
      </span>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Управление контентом</span>
    </span>
  );
}
