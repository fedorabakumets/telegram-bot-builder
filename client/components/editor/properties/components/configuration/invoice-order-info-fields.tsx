/**
 * @fileoverview Запрос и сохранение order_info (имя / email / телефон) для фиата
 * @module components/editor/properties/components/configuration/invoice-order-info-fields
 */

import { Label } from '@/components/ui/label';
import { PropertyCheckbox } from '../common/property-checkbox';
import { VariableNameInput } from '../variables/variable-name-input';
import { isStaticStarsCurrency, normalizeInvoiceCurrency } from './invoice-currency-utils';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы блока order_info */
interface InvoiceOrderInfoFieldsProps {
  /** ID узла */
  nodeId: string;
  /** Data узла */
  data: any;
  /** Обновление data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Доступные переменные */
  textVariables?: Variable[];
}

/**
 * Галочки need_* и поля saveOrder*To; только при валюте ≠ XTR
 * @param props - Пропсы
 * @returns JSX или null
 */
export function InvoiceOrderInfoFields({
  nodeId,
  data,
  onNodeUpdate,
  textVariables = [],
}: InvoiceOrderInfoFieldsProps) {
  if (isStaticStarsCurrency(data?.invoiceCurrency)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold">Данные покупателя (фиат)</Label>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Telegram спросит поля перед оплатой. Сохранение — после успешной оплаты.
      </p>

      <PropertyCheckbox
        id={`inv-need-name-${nodeId}`}
        label="Запросить имя"
        checked={Boolean(data?.invoiceNeedName)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceNeedName: checked })}
      />
      {Boolean(data?.invoiceNeedName) && (
        <VariableNameInput
          value={data?.saveOrderNameTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(nodeId, { saveOrderNameTo: value })}
          placeholder="buyer_name"
        />
      )}

      <PropertyCheckbox
        id={`inv-need-email-${nodeId}`}
        label="Запросить email"
        checked={Boolean(data?.invoiceNeedEmail)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceNeedEmail: checked })}
      />
      {Boolean(data?.invoiceNeedEmail) && (
        <VariableNameInput
          value={data?.saveOrderEmailTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(nodeId, { saveOrderEmailTo: value })}
          placeholder="buyer_email"
        />
      )}

      <PropertyCheckbox
        id={`inv-need-phone-${nodeId}`}
        label="Запросить телефон"
        checked={Boolean(data?.invoiceNeedPhone)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceNeedPhone: checked })}
      />
      {Boolean(data?.invoiceNeedPhone) && (
        <VariableNameInput
          value={data?.saveOrderPhoneTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(nodeId, { saveOrderPhoneTo: value })}
          placeholder="buyer_phone"
        />
      )}

      <PropertyCheckbox
        id={`inv-need-ship-${nodeId}`}
        label="Запросить адрес доставки"
        checked={Boolean(data?.invoiceNeedShipping)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceNeedShipping: checked })}
      />
      <PropertyCheckbox
        id={`inv-flexible-${nodeId}`}
        label="Цена зависит от доставки (is_flexible)"
        checked={Boolean(data?.invoiceIsFlexible)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceIsFlexible: checked })}
      />
      <PropertyCheckbox
        id={`inv-send-phone-${nodeId}`}
        label="Отправить телефон провайдеру"
        checked={Boolean(data?.invoiceSendPhoneToProvider)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceSendPhoneToProvider: checked })}
      />
      <PropertyCheckbox
        id={`inv-send-email-${nodeId}`}
        label="Отправить email провайдеру"
        checked={Boolean(data?.invoiceSendEmailToProvider)}
        onChange={(checked) => onNodeUpdate(nodeId, { invoiceSendEmailToProvider: checked })}
      />
    </div>
  );
}
