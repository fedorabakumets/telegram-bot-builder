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
    <div className="px-1 py-0.5">
      {/* Таблица + операция в одну строку */}
      <div className="flex items-center gap-1 truncate">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
          {tableName || 'Таблица'}
        </span>
        <span className="text-[10px] px-1 py-px rounded bg-amber-200/60 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 whitespace-nowrap">
          {OPERATION_LABELS[operation] || operation}
        </span>
      </div>

      {/* Краткое описание — вторая строка */}
      {(description || d?.saveResultTo) && (
        <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
          {description}{description && d?.saveResultTo ? ' → ' : ''}{d?.saveResultTo ? `{${d.saveResultTo}}` : ''}
        </div>
      )}
    </div>
  );
}
