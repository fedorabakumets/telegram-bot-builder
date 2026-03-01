/**
 * @fileoverview Компонент ввода ожидаемого значения для условия
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExpectedValueInputProps {
  condition: any;
  selectedNode: any;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

/**
 * Компонент ввода ожидаемого значения
 */
export function ExpectedValueInput({ condition, selectedNode, onNodeUpdate }: ExpectedValueInputProps) {
  const isEquals = condition.condition === 'user_data_equals';
  const isContains = condition.condition === 'user_data_contains';

  if (!isEquals && !isContains) return null;

  return (
    <div className="space-y-2 sm:space-y-2.5 bg-gradient-to-br from-orange-50/40 to-yellow-50/30 dark:from-orange-950/15 dark:to-yellow-950/10 border border-orange-200/40 dark:border-orange-800/40 rounded-xl p-3 sm:p-4">
      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
        <i className="fas fa-target text-orange-600 dark:text-orange-400"></i>
        <span>{isEquals ? 'Точное значение ответа' : 'Текст в ответе'}</span>
      </Label>
      <Input
        value={condition.expectedValue || ''}
        onChange={(e) => updateCondition(condition, selectedNode, { expectedValue: e.target.value }, onNodeUpdate)}
        className="text-xs sm:text-sm h-10 sm:h-11 bg-white/70 dark:bg-slate-950/70 border border-orange-300/50 dark:border-orange-700/50 focus:border-orange-500 rounded-lg"
        placeholder={isEquals ? 'Точное значение...' : 'Искомый текст...'}
      />
      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {isEquals
          ? 'Пример: "Да", "Мужской", "25"'
          : 'Пример: "привет" найдет "привет мир" и "привет там"'}
      </div>
    </div>
  );
}
