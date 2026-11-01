/** @fileoverview Предварительный просмотр ячеек до применения массовой операции. */
import type { CellEditPlan } from '../utils/cell-edit-plan';
import type { BotTable } from '../types';
import { getColumnLabel } from '../utils/display-labels';
/** Свойства предварительного просмотра. */
interface TableBulkPreviewProps {
  /** План операции. */
  plan: CellEditPlan;
  /** Снимок таблицы. */
  table: BotTable;
}
/**
 * Показывает исходные и новые значения, а также ошибки до сохранения.
 * @param props - План и таблица.
 * @returns Таблица сравнения.
 */
export function TableBulkPreview({ plan, table }: TableBulkPreviewProps) {
  return <div className="space-y-3">
    <p role="status" className="text-sm">Будет изменено ячеек: {plan.edits.length}</p>
    {plan.errors.map((error) => <p key={error} role="alert" className="text-sm text-destructive">{error}</p>)}
    <div className="max-h-64 overflow-auto rounded-md border border-border">
      <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-background"><tr><th className="p-2">Строка / столбец</th><th className="p-2">Было</th><th className="p-2">Станет</th></tr></thead><tbody>
        {plan.edits.slice(0, 100).map((edit) => <tr key={`${edit.rowId}:${edit.columnId}`}>
          <td className="p-2 text-xs">{table.rows.find((row) => row.id === edit.rowId)?.rowIndex} · {getColumnLabel(table.columns.find((column) => column.id === edit.columnId)?.name ?? '')}</td>
          <td className="max-w-64 whitespace-pre-wrap break-words p-2 text-muted-foreground">{edit.before || 'Пусто'}</td><td className="max-w-64 whitespace-pre-wrap break-words p-2">{edit.after || 'Пусто'}</td>
        </tr>)}
      </tbody></table>
    </div>
    {plan.edits.length > 100 && <p className="text-xs text-muted-foreground">Показаны первые 100 изменений из {plan.edits.length}</p>}
  </div>;
}
