/**
 * @fileoverview Select-переходы узла refund_stars (4 выхода)
 * @module components/editor/properties/components/configuration/refund-transitions-fields
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';

/** Описание одного Select перехода */
interface TransitionField {
  /** Ключ в data */
  key: string;
  /** Русская подпись */
  label: string;
  /** Успех пишет ещё enableAutoTransition */
  isSuccess?: boolean;
}

/** Четыре выхода с русскими подписями */
const TRANSITION_FIELDS: TransitionField[] = [
  { key: 'autoTransitionTo', label: 'Успех', isSuccess: true },
  { key: 'refundEmptyTarget', label: 'Пустой код' },
  { key: 'refundNotFoundTarget', label: 'Код не найден' },
  { key: 'refundAlreadyRefundedTarget', label: 'Уже возвращён' },
];

/** Пропсы блока переходов */
interface RefundTransitionsFieldsProps {
  /** Данные узла */
  data: any;
  /** ID узла */
  nodeId: string;
  /** Обновление data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Доступные цели */
  availableTargets: Array<{ node: Node; sheetName: string }>;
  /** Подпись узла в Select */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
}

/**
 * Блок «Переходы» с четырьмя Select
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RefundTransitionsFields({
  data,
  nodeId,
  onNodeUpdate,
  availableTargets,
  formatNodeDisplay,
}: RefundTransitionsFieldsProps) {
  /**
   * Применяет выбранный target к полю
   * @param field - Описание поля
   * @param value - ID узла или sentinel
   */
  const apply = (field: TransitionField, value: string) => {
    const next = value === 'no-transition' ? '' : value;
    if (field.isSuccess) {
      onNodeUpdate(nodeId, {
        autoTransitionTo: next,
        enableAutoTransition: Boolean(next),
      });
      return;
    }
    onNodeUpdate(nodeId, { [field.key]: next });
  };

  return (
    <div className="space-y-3 rounded-lg border border-yellow-200/50 dark:border-yellow-800/40 p-3">
      <Label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
        Переходы
      </Label>
      {TRANSITION_FIELDS.map((field) => {
        const current = (data?.[field.key] as string) || '';
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">{field.label}</Label>
            <Select
              value={current || 'no-transition'}
              onValueChange={(v) => apply(field, v)}
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
        );
      })}
    </div>
  );
}
