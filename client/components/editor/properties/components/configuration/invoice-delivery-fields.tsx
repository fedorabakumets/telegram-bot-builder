/**
 * @fileoverview Поля доставки счёта в чат / супергруппу (только send_invoice)
 * @module components/editor/properties/components/configuration/invoice-delivery-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PropertyCheckbox } from '../common/property-checkbox';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы */
interface InvoiceDeliveryFieldsProps {
  /** ID узла */
  nodeId: string;
  /** Data */
  data: any;
  /** Обновление */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Переменные */
  textVariables?: Variable[];
}

/**
 * thread_id, silent, reply, effect и пр.
 * @param props - Пропсы
 * @returns JSX
 */
export function InvoiceDeliveryFields({
  nodeId,
  data,
  onNodeUpdate,
  textVariables = [],
}: InvoiceDeliveryFieldsProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold">Отправка в чат</Label>
      <p className="text-[10px] text-muted-foreground">
        Тема форума и опции сообщения. Пустой топик — обычный чат.
      </p>
      <Input
        className="h-8 text-xs"
        value={data?.invoiceMessageThreadId || ''}
        placeholder="ID темы форума (message_thread_id)"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceMessageThreadId: e.target.value })}
      />
      {textVariables.length > 0 && (
        <VariableSelector
          availableVariables={textVariables}
          onSelect={(v) => onNodeUpdate(nodeId, { invoiceMessageThreadId: `{${v}}` })}
        />
      )}
      <Input
        className="h-8 text-xs"
        value={data?.invoiceDirectMessagesTopicId || ''}
        placeholder="direct_messages_topic_id"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceDirectMessagesTopicId: e.target.value })}
      />
      <Input
        className="h-8 text-xs"
        value={data?.invoiceReplyToMessageId || ''}
        placeholder="Ответ на message_id"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceReplyToMessageId: e.target.value })}
      />
      {textVariables.length > 0 && (
        <VariableSelector
          availableVariables={textVariables}
          onSelect={(v) => onNodeUpdate(nodeId, { invoiceReplyToMessageId: `{${v}}` })}
        />
      )}
      <Input
        className="h-8 text-xs"
        value={data?.invoiceMessageEffectId || ''}
        placeholder="message_effect_id"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceMessageEffectId: e.target.value })}
      />
      <Input
        className="h-8 text-xs"
        value={data?.invoiceStartParameter || ''}
        placeholder="start_parameter (пересылка)"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceStartParameter: e.target.value })}
      />
      <PropertyCheckbox
        id={`inv-protect-${nodeId}`}
        label="Защитить контент (protect_content)"
        checked={Boolean(data?.invoiceProtectContent)}
        onChange={(c) => onNodeUpdate(nodeId, { invoiceProtectContent: c })}
      />
      <PropertyCheckbox
        id={`inv-silent-${nodeId}`}
        label="Тихая отправка"
        checked={Boolean(data?.invoiceDisableNotification)}
        onChange={(c) => onNodeUpdate(nodeId, { invoiceDisableNotification: c })}
      />
      <PropertyCheckbox
        id={`inv-paid-bc-${nodeId}`}
        label="Платный broadcast"
        checked={Boolean(data?.invoiceAllowPaidBroadcast)}
        onChange={(c) => onNodeUpdate(nodeId, { invoiceAllowPaidBroadcast: c })}
      />
      <Label className="text-[10px] text-muted-foreground">suggested_post_parameters (JSON)</Label>
      <Textarea
        className="min-h-[56px] text-xs font-mono"
        value={data?.invoiceSuggestedPostParams || ''}
        placeholder="{}"
        onChange={(e) => onNodeUpdate(nodeId, { invoiceSuggestedPostParams: e.target.value })}
      />
    </div>
  );
}
