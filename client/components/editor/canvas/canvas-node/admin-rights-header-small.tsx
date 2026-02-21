/**
 * @fileoverview Компонент заголовка узла прав администратора
 * 
 * Отображает заголовок для узла admin_rights
 * с командой и названием.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента AdminRightsHeaderSmall
 *
 * @interface AdminRightsHeaderSmallProps
 * @property {Node} node - Узел с данными
 */
interface AdminRightsHeaderSmallProps {
  node: Node;
}

/**
 * Компонент заголовка прав администратора
 *
 * @component
 * @description Отображает заголовок для узла admin_rights
 *
 * @param {AdminRightsHeaderSmallProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function AdminRightsHeaderSmall({ node }: AdminRightsHeaderSmallProps) {
  return (
    <span className="inline-flex items-center">
      <span className="text-violet-600 dark:text-violet-400 font-mono text-sm bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded-lg border border-violet-200 dark:border-violet-800 mr-2">
        {node.data.command || '/admin_rights'}
      </span>
      <span>Права админа</span>
    </span>
  );
}
