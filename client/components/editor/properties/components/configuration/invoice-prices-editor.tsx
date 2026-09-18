/**
 * @fileoverview Редактор нескольких строк LabeledPrice для счёта
 * @module components/editor/properties/components/configuration/invoice-prices-editor
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';
import { isStaticStarsCurrency } from './invoice-currency-utils';

/** Строка цены в data */
export interface InvoicePriceRow {
  /** ID строки */
  id: string;
  /** Подпись */
  label: string;
  /** Сумма */
  amount: string;
}

/** Пропсы редактора */
interface InvoicePricesEditorProps {
  /** ID узла */
  nodeId: string;
  /** Data узла */
  data: any;
  /** Обновление */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Переменные */
  textVariables?: Variable[];
}

/**
 * Список label+amount; при XTR — не больше одной строки
 * @param props - Пропсы
 * @returns JSX
 */
export function InvoicePricesEditor({
  nodeId,
  data,
  onNodeUpdate,
  textVariables = [],
}: InvoicePricesEditorProps) {
  const isStars = isStaticStarsCurrency(data?.invoiceCurrency);
  const rows: InvoicePriceRow[] = Array.isArray(data?.invoicePrices) && data.invoicePrices.length > 0
    ? data.invoicePrices
    : [{ id: 'p1', label: 'Товар', amount: String(data?.invoiceAmount || '1') }];

  /**
   * Сохраняет строки и синхронизирует invoiceAmount с первой
   * @param next - Новые строки
   */
  const commit = (next: InvoicePriceRow[]) => {
    const safe = isStars ? next.slice(0, 1) : next;
    onNodeUpdate(nodeId, {
      invoicePrices: safe,
      invoiceAmount: safe[0]?.amount || '1',
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold">Строки цены</Label>
      <p className="text-[10px] text-muted-foreground">
        {isStars ? 'Для Stars — только одна позиция.' : 'Несколько позиций в счёте (товар, доставка…).'}
      </p>
      {rows.map((row, idx) => (
        <div key={row.id} className="flex flex-col gap-1 border-b border-border/40 pb-2 last:border-0">
          <div className="flex gap-2 items-center">
            <Input
              className="h-8 text-xs"
              value={row.label}
              placeholder="Подпись"
              onChange={(e) => {
                const next = rows.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r));
                commit(next);
              }}
            />
            <Input
              className="h-8 text-xs w-28"
              value={row.amount}
              placeholder="Сумма"
              onChange={(e) => {
                const next = rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r));
                commit(next);
              }}
            />
            {!isStars && rows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-destructive"
                onClick={() => commit(rows.filter((_, i) => i !== idx))}
              >
                −
              </Button>
            )}
          </div>
          {textVariables.length > 0 && (
            <VariableSelector
              availableVariables={textVariables}
              onSelect={(v) => {
                const next = rows.map((r, i) => (i === idx ? { ...r, amount: `{${v}}` } : r));
                commit(next);
              }}
            />
          )}
        </div>
      ))}
      {!isStars && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            commit([
              ...rows,
              { id: `p_${Date.now()}`, label: 'Позиция', amount: '0' },
            ])
          }
        >
          + Строка
        </Button>
      )}
    </div>
  );
}
