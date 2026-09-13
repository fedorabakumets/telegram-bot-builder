/**
 * @fileoverview Панель свойств узла «Вернуть звёзды»
 * @module components/editor/properties/components/configuration/refund-stars-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели конфигурации возврата */
interface RefundStarsConfigurationProps {
  /** Выбранный узел refund_stars */
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
 * Панель настроек возврата звёзд: кому, код покупки, ошибки, переход
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RefundStarsConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
}: RefundStarsConfigurationProps) {
  const data = selectedNode.data as any;
  const autoTransitionTo: string = data?.autoTransitionTo || '';
  const userSource: string = data?.refundUserSource || 'current_user';
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id,
  );

  /**
   * Обновляет цель перехода после возврата
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
   * Вставляет переменную в поле кода покупки
   * @param varName - Имя переменной
   */
  const insertChargeVariable = (varName: string) => {
    onNodeUpdate(selectedNode.id, { refundChargeId: `{${varName}}` });
  };

  /**
   * Вставляет переменную в поле user id
   * @param varName - Имя переменной
   */
  const insertUserVariable = (varName: string) => {
    onNodeUpdate(selectedNode.id, { refundUserId: `{${varName}}` });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <i className="fas fa-undo text-yellow-500 text-sm" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Вернуть звёзды
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Возврат покупки в этом боте по коду из успешной оплаты.
        Переход сработает только после успешного возврата.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Кому вернуть</Label>
        <Select
          value={userSource}
          onValueChange={(v) => onNodeUpdate(selectedNode.id, { refundUserSource: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_user">Текущий пользователь</SelectItem>
            <SelectItem value="custom">ID из поля / переменной</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {userSource === 'custom' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">ID пользователя</Label>
          <Input
            value={data?.refundUserId || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { refundUserId: e.target.value })}
            placeholder="{user_id} или 123456789"
            className="h-8 text-xs"
          />
          {textVariables.length > 0 && (
            <VariableSelector
              availableVariables={textVariables}
              onSelect={insertUserVariable}
            />
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Код покупки</Label>
        <Input
          value={data?.refundChargeId || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { refundChargeId: e.target.value })}
          placeholder="{payment_charge_id}"
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-gray-400">
          telegram_payment_charge_id из успешной оплаты
        </p>
        {textVariables.length > 0 && (
          <VariableSelector
            availableVariables={textVariables}
            onSelect={insertChargeVariable}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id={`ignore-errors-${selectedNode.id}`}
          type="checkbox"
          checked={Boolean(data?.ignoreErrors)}
          onChange={(e) => onNodeUpdate(selectedNode.id, { ignoreErrors: e.target.checked })}
          className="h-3.5 w-3.5"
        />
        <Label htmlFor={`ignore-errors-${selectedNode.id}`} className="text-xs font-medium">
          Игнорировать ошибки и идти дальше
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">После успешного возврата</Label>
        <Select
          value={autoTransitionTo || 'no-transition'}
          onValueChange={applyTarget}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Без перехода" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-transition">Без перехода</SelectItem>
            {availableTargets.map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                {formatNodeDisplay(node, sheetName)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
