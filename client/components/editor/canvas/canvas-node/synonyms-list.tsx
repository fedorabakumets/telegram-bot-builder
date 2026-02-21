/**
 * @fileoverview Компонент списка синонимов для команд
 * 
 * Отображает визуальное представление списка синонимов команды
 * в виде стилизованных тегов с иконками.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента SynonymsList
 *
 * @interface SynonymsListProps
 * @property {Node} node - Узел с синонимами команды
 */
interface SynonymsListProps {
  node: Node;
}

/**
 * Компонент списка синонимов
 *
 * @component
 * @description Отображает список синонимов команды в виде тегов
 *
 * @param {SynonymsListProps} props - Свойства компонента
 * @param {Node} props.node - Узел с синонимами
 *
 * @returns {JSX.Element | null} Компонент списка синонимов или null если синонимов нет
 */
export function SynonymsList({ node }: SynonymsListProps) {
  if (!node.data.synonyms || node.data.synonyms.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1">
        {node.data.synonyms.map((synonym, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-700/50"
            title={`Синоним: ${synonym}`}
          >
            <i className="fas fa-quote-left text-indigo-400 dark:text-indigo-500 mr-1" style={{ fontSize: '8px' }}></i>
            {synonym}
          </span>
        ))}
      </div>
    </div>
  );
}
