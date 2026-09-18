/**
 * @fileoverview Выбор узла после оплаты для кнопки «Оплатить» у счёта
 * @module properties/components/navigation/invoice-pay-target-section
 */

import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNodeDisplay, getNodeTypeLabel } from '../../utils/node-formatters';

/** Пропсы секции цели после оплаты */
interface InvoicePayTargetSectionProps {
  /** ID текущего узла клавиатуры (исключается из списка) */
  keyboardNodeId: string;
  /** Текущая цель (autoTransitionTo счёта) */
  targetNodeId: string;
  /** Узлы всех листов */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName?: string }>;
  /** Обновление цели на узле send_invoice */
  onTargetChange: (targetNodeId: string) => void;
}

/**
 * Селектор «после оплаты» в карточке кнопки pay
 * @param props - Пропсы
 * @returns JSX секция
 */
export function InvoicePayTargetSection({
  keyboardNodeId,
  targetNodeId,
  getAllNodesFromAllSheets,
  onTargetChange,
}: InvoicePayTargetSectionProps) {
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== keyboardNodeId,
  );
  const selectedTarget = availableTargets.find(({ node }) => node.id === (targetNodeId || ''));

  /**
   * Применяет цель или сбрасывает при «не выбрано»
   * @param value - ID узла или пустая строка
   */
  const apply = (value: string) => {
    onTargetChange(value === 'no-transition' ? '' : value);
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/50 dark:border-yellow-800/40">
      <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
        После оплаты →
      </div>
      <Select value={targetNodeId || 'no-transition'} onValueChange={apply}>
        <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-yellow-300/50 dark:border-yellow-700/40 rounded-lg text-yellow-900 dark:text-yellow-50">
          <SelectValue placeholder="Не выбрано">
            {selectedTarget ? getNodeTypeLabel(selectedTarget.node.type) : 'Не выбрано'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-48 overflow-y-auto">
          <SelectItem value="no-transition">Не выбрано</SelectItem>
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
        value={targetNodeId || ''}
        onChange={(e) => onTargetChange(e.target.value)}
        className="text-xs sm:text-sm font-mono bg-white/60 dark:bg-slate-950/60 border border-yellow-300/40 dark:border-yellow-700/40"
        placeholder="Или ID узла вручную"
      />
    </div>
  );
}
