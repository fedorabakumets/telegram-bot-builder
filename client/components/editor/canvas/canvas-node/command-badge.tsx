/**
 * @fileoverview Компонент заголовка узла команды (start/command)
 * 
 * Отображает название команды в стилизованном блоке
 * с моноширинным шрифтом.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента CommandBadge
 *
 * @interface CommandBadgeProps
 * @property {Node} node - Узел с данными команды
 * @property {'start' | 'command'} type - Тип узла
 */
interface CommandBadgeProps {
  node: Node;
  type: 'start' | 'command';
}

/**
 * Компонент бейджа команды
 *
 * @component
 * @description Отображает бейдж с названием команды
 *
 * @param {CommandBadgeProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 * @param {'start' | 'command'} props.type - Тип узла
 *
 * @returns {JSX.Element} Компонент бейджа команды
 */
export function CommandBadge({ node, type }: CommandBadgeProps) {
  const colorClass = type === 'start' 
    ? 'text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800'
    : 'text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800';

  return (
    <span className="inline-flex items-center">
      <span className={colorClass}>
        {node.data.command || (type === 'start' ? '/start' : '')}
      </span>
    </span>
  );
}
