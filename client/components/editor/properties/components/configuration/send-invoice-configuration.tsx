/**
 * @fileoverview Панель свойств узла «Выставить счёт в звёздах»
 * @module components/editor/properties/components/configuration/send-invoice-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели конфигурации счёта */
interface SendInvoiceConfigurationProps {
  /** Выбранный узел send_invoice */
  selectedNode: Node;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Узлы всех листов для выбора перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Форматирование подписи узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные переменные */
  textVariables?: Variable[];
}

/**
 * Панель настроек счёта в звёздах: товар, цена, метка, сохранение, переход после оплаты
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SendInvoiceConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
}: SendInvoiceConfigurationProps) {
  const data = selectedNode.data as any;
  const autoTransitionTo: string = data?.autoTransitionTo || '';
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id,
  );

  /**
   * Обновляет цель перехода после оплаты
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
        <i className="fas fa-star text-yellow-500 text-sm" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Выставить счёт в звёздах
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Бот отправит счёт в чат. Переход к следующему узлу сработает только после оплаты,
        не сразу после отправки счёта.
      </p>

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
        <Label className="text-xs font-medium">Цена в звёздах</Label>
        <Input
          value={data?.invoiceAmount || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoiceAmount: e.target.value })}
          placeholder="1"
          className="h-8 text-xs"
        />
        {textVariables.length > 0 && (
          <VariableSelector
            availableVariables={textVariables}
            onSelect={insertAmountVariable}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Картинка (URL)</Label>
        <Input
          value={data?.invoicePhotoUrl || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { invoicePhotoUrl: e.target.value })}
          placeholder="https://…"
          className="h-8 text-xs"
        />
      </div>

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
        <Input
          value={data?.savePaymentAmountTo || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { savePaymentAmountTo: e.target.value })}
          placeholder="payment_amount"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить код покупки в переменную</Label>
        <Input
          value={data?.savePaymentChargeIdTo || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { savePaymentChargeIdTo: e.target.value })}
          placeholder="payment_charge_id"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-yellow-50/60 to-amber-50/40 dark:from-yellow-950/30 dark:to-amber-950/20 border border-yellow-200/40 dark:border-yellow-700/40">
        <Label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
          После оплаты
        </Label>
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
