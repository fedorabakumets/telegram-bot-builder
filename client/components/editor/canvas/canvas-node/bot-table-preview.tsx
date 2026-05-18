/**
 * @fileoverview Превью узла bot_table на холсте редактора
 * @module components/editor/canvas/canvas-node/bot-table-preview
 */

import { Node } from '@shared/schema';

/** Пропсы компонента превью таблицы */
interface BotTablePreviewProps {
  /** Узел bot_table */
  node: Node;
}

/** Метки операций для отображения */
const OPERATION_LABELS: Record<string, string> = {
  read: 'Прочитать',
  insert: 'Вставить',
  update: 'Обновить',
  upsert: 'Создать/Обновить',
  delete: 'Удалить',
};

/** Метки операций обновления */
const OP_SYMBOLS: Record<string, string> = {
  set: '=',
  increment: '+',
  decrement: '−',
  min: 'min',
  max: 'max',
};

/**
 * Компонент превью узла bot_table на холсте
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function BotTablePreview({ node }: BotTablePreviewProps) {
  const d = node.data as any;
  const tableName: string = d?.tableName || '';
  const operation: string = d?.operation || 'read';
  const where: Array<{ column: string; value: string }> = d?.where || [];
  const updates: Array<{ column: string; op: string; value: string }> = d?.updates || [];

  /** Краткое описание операции */
  const getDescription = (): string => {
    if (operation === 'read' || operation === 'delete') {
      if (where.length > 0 && where[0].column) {
        return `${where[0].column} = ${where[0].value || '?'}`;
      }
      return '';
    }
    if (operation === 'update' && updates.length > 0 && updates[0].column) {
      const u = updates[0];
      return `${u.column} ${OP_SYMBOLS[u.op] || '='} ${u.value || '?'}`;
    }
    return '';
  };

  const description = getDescription();

  return (
    <div className="space-y-1.5 p-1">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-1.5">
        <i className="fas fa-table text-amber-500 dark:text-amber-400 text-xs" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 truncate">
          {tableName || 'Таблица'}
        </span>
      </div>

      {/* Операция */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
          {OPERATION_LABELS[operation] || operation}
        </span>
        {d?.saveResultTo && (
          <span className="text-xs text-muted-foreground">
            <span className="text-slate-400 dark:text-slate-500">→ </span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              {'{' + d.saveResultTo + '}'}
            </span>
          </span>
        )}
      </div>

      {/* Краткое описание */}
      {description && (
        <div className="text-xs font-mono text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded px-1.5 py-0.5 truncate">
          {description}
        </div>
      )}
    </div>
  );
}
