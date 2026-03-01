/**
 * @fileoverview Компонент выбора типа условия для условного сообщения
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONDITION_TYPES, ConditionType } from './condition-type-config';

interface ConditionTypeSelectorProps {
  condition: any;
  onConditionChange: (value: ConditionType) => void;
}

/**
 * Компонент выбора типа условия
 */
export function ConditionTypeSelector({ condition, onConditionChange }: ConditionTypeSelectorProps) {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
        <i className="fas fa-code-branch text-purple-600 dark:text-purple-400"></i>
        <span>Тип условия</span>
      </Label>
      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-purple-50/50 dark:bg-purple-950/20 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg border border-purple-200/40 dark:border-purple-800/40">
        Выберите правило для проверки ответов пользователя
      </div>
      <Select value={condition.condition} onValueChange={onConditionChange}>
        <SelectTrigger className="text-xs sm:text-sm h-10 sm:h-11 bg-gradient-to-br from-purple-50/60 via-white/60 to-white/60 dark:from-purple-950/30 dark:via-slate-900/60 dark:to-slate-950/70 border border-purple-300/60 dark:border-purple-700/60 hover:border-purple-400/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/50 transition-all rounded-xl text-purple-900 dark:text-purple-100 font-medium shadow-sm">
          <SelectValue placeholder="Выберите тип условия..." />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-b from-slate-50 to-slate-50 dark:from-slate-900 dark:to-slate-900 rounded-xl">
          {CONDITION_TYPES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              <div className="flex items-center gap-2">
                <span className={opt.symbolColor}>{opt.symbol}</span>
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
