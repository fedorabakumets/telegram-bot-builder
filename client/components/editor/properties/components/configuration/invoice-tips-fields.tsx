/**
 * @fileoverview Чаевые счёта: max_tip и suggested (фиат)
 * @module components/editor/properties/components/configuration/invoice-tips-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isStaticStarsCurrency } from './invoice-currency-utils';

/** Пропсы */
interface InvoiceTipsFieldsProps {
  /** ID узла */
  nodeId: string;
  /** Data */
  data: any;
  /** Обновление */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Поля чаевых; скрыты при XTR
 * @param props - Пропсы
 * @returns JSX или null
 */
export function InvoiceTipsFields({ nodeId, data, onNodeUpdate }: InvoiceTipsFieldsProps) {
  if (isStaticStarsCurrency(data?.invoiceCurrency)) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold">Чаевые (фиат)</Label>
      <Input
        className="h-8 text-xs"
        value={data?.invoiceMaxTipAmount || ''}
        placeholder="Макс. чаевые (минорные единицы)"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceMaxTipAmount: e.target.value })}
      />
      <Input
        className="h-8 text-xs"
        value={data?.invoiceSuggestedTipAmounts || ''}
        placeholder="Предложения: 10,20,50"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceSuggestedTipAmounts: e.target.value })}
      />
    </div>
  );
}
