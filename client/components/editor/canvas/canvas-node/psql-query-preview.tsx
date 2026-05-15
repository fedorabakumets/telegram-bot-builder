/**
 * @fileoverview Превью узла SQL-запроса на холсте редактора
 * @module components/editor/canvas/canvas-node/psql-query-preview
 */

import { Node } from '@shared/schema';

/** Пропсы компонента превью SQL-запроса */
interface PsqlQueryPreviewProps {
  /** Узел psql_query */
  node: Node;
}

/** Метки форматов результата для отображения */
const FORMAT_LABELS: Record<string, string> = {
  first_row: 'Первая строка',
  json: 'JSON',
  text: 'Текст',
  affected: 'Кол-во строк',
};

/**
 * Компонент превью узла SQL-запроса на холсте
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function PsqlQueryPreview({ node }: PsqlQueryPreviewProps) {
  const d = node.data as any;
  const query: string = d?.query || '';
  const saveResultTo: string = d?.saveResultTo || '';
  const resultFormat: string = d?.resultFormat || 'first_row';
  const previewQuery = query.length > 50 ? query.slice(0, 50) + '…' : query;

  return (
    <div className="space-y-1.5 p-1">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-1.5">
        <i className="fas fa-database text-violet-500 dark:text-violet-400 text-xs" />
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
          PostgreSQL
        </span>
      </div>

      {/* Превью SQL-запроса */}
      {previewQuery ? (
        <div className="text-xs font-mono text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded px-1.5 py-1 break-all">
          {previewQuery}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          SQL не задан
        </div>
      )}

      {/* Формат и переменная результата */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-medium">
          {FORMAT_LABELS[resultFormat] || resultFormat}
        </span>
        {saveResultTo && (
          <span className="text-xs text-muted-foreground">
            <span className="text-slate-400 dark:text-slate-500">→ </span>
            <span className="font-mono text-violet-600 dark:text-violet-400">
              {'{' + saveResultTo + '}'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
