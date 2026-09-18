/**
 * @fileoverview Панель свойств узла «Баланс звёзд»
 * @module components/editor/properties/components/configuration/get-star-balance-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableNameInput } from '../variables/variable-name-input';
import { PropertyCheckbox } from '../common/property-checkbox';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели */
interface GetStarBalanceConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Обновление data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Узлы для селектов переходов */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Подпись узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Переменные */
  textVariables?: Variable[];
}

/**
 * Настройки: переменная баланса, тексты и переходы успех/ошибка
 * @param props - Пропсы
 * @returns JSX
 */
export function GetStarBalanceConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
}: GetStarBalanceConfigurationProps) {
  const data = selectedNode.data as any;
  const targets = getAllNodesFromAllSheets.filter(({ node }) => node.id !== selectedNode.id);

  /**
   * Селект цели по полю data
   * @param field - Имя поля
   * @param value - ID или no-transition
   */
  const applyTarget = (field: string, value: string) => {
    const next = value === 'no-transition' ? '' : value;
    if (field === 'autoTransitionTo') {
      onNodeUpdate(selectedNode.id, {
        autoTransitionTo: next,
        enableAutoTransition: Boolean(next),
      });
      return;
    }
    onNodeUpdate(selectedNode.id, { [field]: next });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <i className="fas fa-coins text-yellow-500 text-sm" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Баланс звёзд
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Bot API getMyStarBalance: сколько звёзд на счету <strong>бота</strong> (не пользователя).
        Целое число amount сохраняется в переменную.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сохранить баланс в переменную</Label>
        <VariableNameInput
          value={data?.saveStarBalanceTo || ''}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { saveStarBalanceTo: value })}
          placeholder="star_balance"
        />
      </div>

      <PropertyCheckbox
        id={`bal-ignore-${selectedNode.id}`}
        label="Не прерывать при ошибке"
        checked={Boolean(data?.ignoreErrors)}
        onChange={(checked) => onNodeUpdate(selectedNode.id, { ignoreErrors: checked })}
        description="После сообщения об ошибке перейти на «Успех», если он задан"
      />

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Текст: ошибка API</Label>
        <Input
          value={data?.balanceMsgError || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { balanceMsgError: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      {(
        [
          ['autoTransitionTo', 'После успеха', data?.autoTransitionTo],
          ['balanceErrorTarget', 'Ошибка', data?.balanceErrorTarget],
        ] as const
      ).map(([field, label, value]) => (
        <div key={field} className="space-y-1.5">
          <Label className="text-xs font-medium">{label}</Label>
          <Select
            value={(value as string) || 'no-transition'}
            onValueChange={(v) => applyTarget(field, v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Без перехода" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              <SelectItem value="no-transition">Без перехода</SelectItem>
              {targets.map(({ node, sheetName }) => (
                <SelectItem key={node.id} value={node.id}>
                  <span className="text-xs font-mono truncate">
                    {formatNodeDisplay(node, sheetName)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
