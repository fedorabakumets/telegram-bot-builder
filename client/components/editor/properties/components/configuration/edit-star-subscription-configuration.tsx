/**
 * @fileoverview Панель свойств узла «Подписка за звёзды»
 * @module components/editor/properties/components/configuration/edit-star-subscription-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableSelector } from '../variables/variable-selector';
import { PropertyCheckbox } from '../common/property-checkbox';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели */
interface EditStarSubscriptionConfigurationProps {
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
 * Настройки: кому, код, отменить/включить, тексты и переходы
 * @param props - Пропсы
 * @returns JSX
 */
export function EditStarSubscriptionConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables = [],
}: EditStarSubscriptionConfigurationProps) {
  const data = selectedNode.data as any;
  const userSource: string = data?.subscriptionUserSource || 'current_user';
  const action: string = data?.subscriptionAction === 'enable' ? 'enable' : 'cancel';
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
        <i className="fas fa-sync-alt text-yellow-500 text-sm" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          Подписка за звёзды
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Bot API editUserStarSubscription: отменить автопродление или снова разрешить его.
        Нужен код покупки из оплаты подписки. Возврат звёзд — отдельный узел.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Действие</Label>
        <Select
          value={action}
          onValueChange={(v) => onNodeUpdate(selectedNode.id, { subscriptionAction: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cancel">Отменить автопродление</SelectItem>
            <SelectItem value="enable">Разрешить автопродление снова</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Кому</Label>
        <Select
          value={userSource}
          onValueChange={(v) => onNodeUpdate(selectedNode.id, { subscriptionUserSource: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_user">Текущий пользователь</SelectItem>
            <SelectItem value="custom">ID или переменная</SelectItem>
          </SelectContent>
        </Select>
        {userSource === 'custom' && (
          <>
            <Input
              value={data?.subscriptionUserId || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { subscriptionUserId: e.target.value })}
              placeholder="{user_id} или число"
              className="h-8 text-xs"
            />
            {textVariables.length > 0 && (
              <VariableSelector
                availableVariables={textVariables}
                onSelect={(name) =>
                  onNodeUpdate(selectedNode.id, { subscriptionUserId: `{${name}}` })
                }
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Код покупки</Label>
        <Input
          value={data?.subscriptionChargeId || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { subscriptionChargeId: e.target.value })}
          placeholder="{payment_charge_id}"
          className="h-8 text-xs font-mono"
        />
        {textVariables.length > 0 && (
          <VariableSelector
            availableVariables={textVariables}
            onSelect={(name) =>
              onNodeUpdate(selectedNode.id, { subscriptionChargeId: `{${name}}` })
            }
          />
        )}
      </div>

      <PropertyCheckbox
        id={`sub-ignore-${selectedNode.id}`}
        label="Не прерывать при ошибке"
        checked={Boolean(data?.ignoreErrors)}
        onChange={(checked) => onNodeUpdate(selectedNode.id, { ignoreErrors: checked })}
        description="После сообщения об ошибке перейти на «Успех», если он задан"
      />

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Текст: пустой код</Label>
        <Input
          value={data?.subscriptionMsgEmpty || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { subscriptionMsgEmpty: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Текст: ошибка API</Label>
        <Input
          value={data?.subscriptionMsgError || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { subscriptionMsgError: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      {(
        [
          ['autoTransitionTo', 'После успеха', data?.autoTransitionTo],
          ['subscriptionEmptyTarget', 'Пустой код', data?.subscriptionEmptyTarget],
          ['subscriptionErrorTarget', 'Ошибка', data?.subscriptionErrorTarget],
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
