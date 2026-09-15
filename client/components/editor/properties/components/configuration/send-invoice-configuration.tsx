/**
 * @fileoverview Панель свойств узла «Выставить счёт в звёздах»
 * @module components/editor/properties/components/configuration/send-invoice-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableSelector } from '../variables/variable-selector';
import { VariableNameInput } from '../variables/variable-name-input';
import { InvoicePhotoField } from './invoice-photo-field';
import {
  InvoiceCurrencyProviderFields,
  normalizeInvoiceCurrency,
} from './invoice-currency-provider-fields';
import { isStaticStarsCurrency } from './invoice-currency-utils';
import { InvoiceOrderInfoFields } from './invoice-order-info-fields';
import type { Variable } from '../../../inline-rich/types';
import { getKeyboardNodeId } from '../../../canvas/canvas-node/keyboard-connection';
import { findPayButtonOnKeyboard } from '../../utils/invoice-pay-connection';
import { useMemo } from 'react';

/** Пропсы панели конфигурации счёта */
interface SendInvoiceConfigurationProps {
  /** Выбранный узел send_invoice */
  selectedNode: Node;
  /** ID проекта для загрузки картинки */
  projectId: number;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Узлы всех листов для выбора перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Форматирование подписи узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные переменные */
  textVariables?: Variable[];
  /** Env-ключи бота для токена провайдера */
  envVariables?: Array<{ key: string; value: string }>;
}

/**
 * Панель настроек счёта в звёздах: товар, цена, метка, сохранение, переход после оплаты
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SendInvoiceConfiguration({
  selectedNode,
  projectId,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
  envVariables = [],
}: SendInvoiceConfigurationProps) {
  const data = selectedNode.data as any;
  const rawCurrency = String(data?.invoiceCurrency ?? 'XTR').trim() || 'XTR';
  const currency = rawCurrency.includes('{') ? rawCurrency : normalizeInvoiceCurrency(rawCurrency);
  const isStars = isStaticStarsCurrency(rawCurrency);
  const autoTransitionTo: string = data?.autoTransitionTo || '';
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id,
  );

  /** Есть ли связанная клавиатура с кнопкой «Оплатить» — тогда цель та же, что у кнопки */
  const hasPayKeyboard = useMemo(() => {
    const kbId = getKeyboardNodeId(data);
    if (!kbId) return false;
    const kbEntry = getAllNodesFromAllSheets.find(({ node }) => node.id === kbId);
    return Boolean(kbEntry && findPayButtonOnKeyboard(kbEntry.node));
  }, [data, getAllNodesFromAllSheets]);

  /**
   * Обновляет цель перехода после оплаты (то же поле, что у кнопки pay на клавиатуре)
   * @param value - ID узла или sentinel без перехода
   */
  const applyTarget = (value: string) => {
    const next = value === 'no-transition' ? '' : value;
    onNodeUpdate(selectedNode.id, {
      autoTransitionTo: next,
      enableAutoTransition: Boolean(next),
    });
  };

  /**
   * Вставляет переменную в поле цены
   * @param varName - Имя переменной
   */
  const insertAmountVariable = (varName: string) => {
    onNodeUpdate(selectedNode.id, { invoiceAmount: `{${varName}}` });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <i className={`${isStars ? 'fas fa-star' : 'fas fa-receipt'} text-yellow-500 text-sm`} />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Выставить счёт
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Счёт в чат: звёзды (XTR) или фиат через провайдера BotFather.
        Переход после оплаты — от кнопки «Оплатить» (autoTransitionTo счёта).
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
        <p className="text-[10px] text-gray-400">1–32 знака</p>
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
        <p className="text-[10px] text-gray-400">1–255 знаков</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {isStars ? 'Цена в звёздах' : `Цена (${currency}, минорные единицы)`}
        </Label>
        <Input
          value={data?.invoiceAmount || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoiceAmount: e.target.value })}
          placeholder={isStars ? '1' : '100'}
          className="h-8 text-xs"
        />
        {textVariables.length > 0 && (
          <VariableSelector
            availableVariables={textVariables}
            onSelect={insertAmountVariable}
          />
        )}
      </div>

      <InvoicePhotoField
        projectId={projectId}
        nodeId={selectedNode.id}
        value={data?.invoicePhotoUrl || ''}
        onChange={(value) => onNodeUpdate(selectedNode.id, { invoicePhotoUrl: value })}
        textVariables={textVariables}
      />

      <p className="text-[10px] text-muted-foreground leading-relaxed rounded-md border border-dashed border-yellow-300/50 dark:border-yellow-700/40 px-2 py-1.5">
        Подписка на 30 дней в чате недоступна (Telegram: только ссылка).
        Используйте узел «Ссылка на счёт».
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Скрытая метка покупки</Label>
        <Input
          value={data?.invoicePayload || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoicePayload: e.target.value })}
          placeholder={`по умолчанию: ${selectedNode.id}`}
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-gray-400">
          Пользователь не видит. Пусто = номер этого узла
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить сумму в переменную</Label>
        <VariableNameInput
          value={data?.savePaymentAmountTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { savePaymentAmountTo: value })}
          placeholder="payment_amount"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить код покупки в переменную</Label>
        <VariableNameInput
          value={data?.savePaymentChargeIdTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { savePaymentChargeIdTo: value })}
          placeholder="payment_charge_id"
        />
      </div>

      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-yellow-50/60 to-amber-50/40 dark:from-yellow-950/30 dark:to-amber-950/20 border border-yellow-200/40 dark:border-yellow-700/40">
        <Label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
          После оплаты
        </Label>
        {hasPayKeyboard && (
          <p className="text-[10px] text-yellow-700/80 dark:text-yellow-300/70 mb-2 leading-relaxed">
            То же, что у кнопки «Оплатить» на клавиатуре — стрелка на холсте идёт от неё.
          </p>
        )}
        <Select value={autoTransitionTo || 'no-transition'} onValueChange={applyTarget}>
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
        <Input
          value={autoTransitionTo && autoTransitionTo !== 'no-transition' ? autoTransitionTo : ''}
          onChange={(e) => applyTarget(e.target.value || 'no-transition')}
          className="text-xs h-8 mt-1.5 bg-white/60 dark:bg-slate-950/60"
          placeholder="или ID вручную"
        />
      </div>
    </div>
  );
}
