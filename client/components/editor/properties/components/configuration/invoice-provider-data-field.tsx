/**
 * @fileoverview provider_data JSON для счёта
 * @module components/editor/properties/components/configuration/invoice-provider-data-field
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Пропсы */
interface InvoiceProviderDataFieldProps {
  /** ID узла */
  nodeId: string;
  /** Текущее значение */
  value: string;
  /** Обновление */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Textarea provider_data
 * @param props - Пропсы
 * @returns JSX
 */
export function InvoiceProviderDataField({
  nodeId,
  value,
  onNodeUpdate,
}: InvoiceProviderDataFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Данные для провайдера (JSON)</Label>
      <Textarea
        className="min-h-[72px] text-xs font-mono"
        value={value || ''}
        placeholder='{"order_id":"{order}"}'
        onChange={(e) => onNodeUpdate(nodeId, { invoiceProviderData: e.target.value })}
      />
    </div>
  );
}
