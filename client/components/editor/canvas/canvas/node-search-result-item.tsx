/**
 * @fileoverview Элемент списка результатов поиска узлов
 *
 * Отображает одну найденную ноду: имя типа и краткое содержимое
 * с подсветкой совпадений. Клик центрирует холст на узле.
 */

import { getNodeTypeLabel } from '@/components/editor/properties/utils/node-formatters';
import { getShortContent } from '@/components/editor/sidebar/hooks/use-sheet-node-search';
import { HighlightText } from '@/components/editor/sidebar/components/highlight-text';

/**
 * Свойства элемента результата поиска
 */
interface NodeSearchResultItemProps {
  /** Узел проекта */
  node: any;
  /** Поисковый запрос для подсветки совпадений */
  query: string;
  /** Колбэк выбора узла по его идентификатору */
  onSelect: (nodeId: string) => void;
}

/**
 * Элемент списка результатов поиска узлов
 *
 * @param props - Свойства элемента
 * @returns JSX элемент строки результата
 */
export function NodeSearchResultItem({ node, query, onSelect }: NodeSearchResultItemProps) {
  const typeLabel = getNodeTypeLabel(node.type);
  const content = getShortContent(node);

  return (
    <button
      onClick={() => onSelect(node.id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none text-left transition-colors duration-100 hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      {/* Иконка узла */}
      <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-violet-500/10 dark:bg-violet-500/15">
        <i className="fas fa-cube text-violet-500 dark:text-violet-400" style={{ fontSize: '10px' }} />
      </div>

      {/* Имя типа и краткое содержимое */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">
          <HighlightText text={typeLabel} query={query} />
        </p>
        {content && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate leading-tight">
            <HighlightText text={content} query={query} />
          </p>
        )}
      </div>
    </button>
  );
}
