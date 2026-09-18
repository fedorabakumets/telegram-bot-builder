/**
 * @fileoverview Панель свойств узла «Ссылка на счёт»
 * @module components/editor/properties/components/configuration/create-invoice-link-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableNameInput } from '../variables/variable-name-input';
import { InvoicePhotoField } from './invoice-photo-field';
import { InvoiceSubscriptionToggle } from './invoice-subscription-toggle';
import {
  InvoiceCurrencyProviderFields,
  normalizeInvoiceCurrency,
} from './invoice-currency-provider-fields';
import { isStaticStarsCurrency } from './invoice-currency-utils';
import { InvoiceOrderInfoFields } from './invoice-order-info-fields';
import { InvoicePricesEditor } from './invoice-prices-editor';
import { InvoiceTipsFields } from './invoice-tips-fields';
import { InvoiceProviderDataField } from './invoice-provider-data-field';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели ссылки на счёт */
interface CreateInvoiceLinkConfigurationProps {
  /** Выбранный узел create_invoice_link */
  selectedNode: Node;
  /** ID проекта для загрузки картинки */
  projectId: number;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Узлы всех листов */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Подпись узла в селекте */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные переменные */
  textVariables?: Variable[];
  /** Env-ключи бота для токена провайдера */
  envVariables?: Array<{ key: string; value: string }>;
}

/**
 * Настройки: товар, URL в переменную, переход после создания и после оплаты
 * @param props - Пропсы
 * @returns JSX
 */
export function CreateInvoiceLinkConfiguration({
  selectedNode,
  projectId,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
  envVariables = [],
}: CreateInvoiceLinkConfigurationProps) {
  const data = selectedNode.data as any;
  const rawCurrency = String(data?.invoiceCurrency ?? 'XTR').trim() || 'XTR';
  const currency = rawCurrency.includes('{') ? rawCurrency : normalizeInvoiceCurrency(rawCurrency);
  const isStars = isStaticStarsCurrency(rawCurrency);
  const autoTransitionTo: string = data?.autoTransitionTo || '';
  const afterPaymentTo: string = data?.afterPaymentTo || '';
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id,
  );

  /**
   * Цель сразу после создания ссылки
   * @param value - ID узла или sentinel
   */
  const applyAfterCreate = (value: string) => {
    const next = value === 'no-transition' ? '' : value;
    onNodeUpdate(selectedNode.id, {
      autoTransitionTo: next,
      enableAutoTransition: Boolean(next),
    });
  };

  /**
   * Цель после оплаты по ссылке
   * @param value - ID узла или sentinel
   */
  const applyAfterPayment = (value: string) => {
    const next = value === 'no-transition' ? '' : value;
    onNodeUpdate(selectedNode.id, { afterPaymentTo: next });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <i className="fas fa-link text-yellow-500 text-sm" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Ссылка на счёт
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Бот создаёт URL оплаты (`createInvoiceLink`), кладёт в переменную и сразу идёт дальше.
        Карточку в чат не шлёт. Для канала/поздней оплаты — триггер «Успешная оплата».
      </p>

      <InvoiceCurrencyProviderFields
        nodeId={selectedNode.id}
        data={data}
        onNodeUpdate={onNodeUpdate}
        envVariables={envVariables}
      />

      <InvoiceOrderInfoFields
        nodeId={selectedNode.id}
        data={data}
        onNodeUpdate={onNodeUpdate}
        textVariables={textVariables}
      />

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Название</Label>
        <Input
          value={data?.invoiceTitle || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoiceTitle: e.target.value })}
          placeholder="Товар"
          maxLength={32}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Описание</Label>
        <Input
          value={data?.invoiceDescription || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoiceDescription: e.target.value })}
          placeholder="Описание товара"
          maxLength={255}
          className="h-8 text-xs"
        />
      </div>

      <InvoicePricesEditor
        nodeId={selectedNode.id}
        data={data}
        onNodeUpdate={onNodeUpdate}
        textVariables={textVariables}
      />

      <InvoiceTipsFields
        nodeId={selectedNode.id}
        data={data}
        onNodeUpdate={onNodeUpdate}
      />

      <InvoiceProviderDataField
        nodeId={selectedNode.id}
        value={data?.invoiceProviderData || ''}
        onNodeUpdate={onNodeUpdate}
      />

      {isStars && (
        <InvoiceSubscriptionToggle
          id={`invoice-link-sub-${selectedNode.id}`}
          checked={Boolean(data?.invoiceSubscription)}
          onChange={(checked) => onNodeUpdate(selectedNode.id, { invoiceSubscription: checked })}
        />
      )}

      <InvoicePhotoField
        projectId={projectId}
        nodeId={selectedNode.id}
        value={data?.invoicePhotoUrl || ''}
        onChange={(value) => onNodeUpdate(selectedNode.id, { invoicePhotoUrl: value })}
        textVariables={textVariables}
        data={data}
        onNodeUpdate={onNodeUpdate}
      />

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Скрытая метка покупки</Label>
        <Input
          value={data?.invoicePayload || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoicePayload: e.target.value })}
          placeholder={`по умолчанию: ${selectedNode.id}`}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить ссылку в переменную</Label>
        <VariableNameInput
          value={data?.saveInvoiceLinkTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { saveInvoiceLinkTo: value })}
          placeholder="invoice_url"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить сумму после оплаты</Label>
        <VariableNameInput
          value={data?.savePaymentAmountTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { savePaymentAmountTo: value })}
          placeholder="payment_amount"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить код покупки после оплаты</Label>
        <VariableNameInput
          value={data?.savePaymentChargeIdTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { savePaymentChargeIdTo: value })}
          placeholder="payment_charge_id"
        />
      </div>

      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-sky-50/60 to-cyan-50/40 dark:from-sky-950/30 dark:to-cyan-950/20 border border-sky-200/40 dark:border-sky-700/40">
        <Label className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1">
          После создания ссылки
        </Label>
        <Select value={autoTransitionTo || 'no-transition'} onValueChange={applyAfterCreate}>
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue placeholder="Без перехода" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            <SelectItem value="no-transition">Без перехода</SelectItem>
            {availableTargets.map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono truncate">
                  {formatNodeDisplay(node, sheetName)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-yellow-50/60 to-amber-50/40 dark:from-yellow-950/30 dark:to-amber-950/20 border border-yellow-200/40 dark:border-yellow-700/40">
        <Label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
          После оплаты
        </Label>
        <p className="text-[10px] text-yellow-700/80 dark:text-yellow-300/70 mb-2">
          Если оплата пришла в этой сессии бота. Иначе — триггер «Успешная оплата».
        </p>
        <Select value={afterPaymentTo || 'no-transition'} onValueChange={applyAfterPayment}>
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue placeholder="Без перехода" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            <SelectItem value="no-transition">Без перехода</SelectItem>
            {availableTargets.map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono truncate">
                  {formatNodeDisplay(node, sheetName)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
